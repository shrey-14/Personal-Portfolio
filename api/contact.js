/* ═══════════════════════════════════════════════════════════════════════════
   SHREY/OS Mail — serverless contact handler  (Vercel:  /api/contact)
   ───────────────────────────────────────────────────────────────────────────
   Receives the compose payload from ContactWindow.jsx and delivers it as an
   email via Resend. The Resend API key stays SERVER-SIDE (env var), never in
   the browser — this is why a serverless function beats client-only EmailJS.

   ── DEPLOY CHECKLIST ────────────────────────────────────────────────────────
   1.  npm i resend
   2.  Create an account at resend.com, verify your sending domain (or use the
       shared onboarding@resend.dev sender while testing).
   3.  In Vercel → Project → Settings → Environment Variables, set:
         RESEND_API_KEY   = re_xxxxxxxxxxxxxxxxxxxx
         CONTACT_TO       = you@yourdomain.com        (where messages land)
         CONTACT_FROM     = SHREY/OS Mail <mail@yourdomain.com>
                            (must be on a domain you've verified in Resend;
                             during testing you may use onboarding@resend.dev)
   4.  Redeploy. The endpoint is live at /api/contact.

   Netlify note: rename to netlify/functions/contact.js and swap the handler
   signature for (event) => ({ statusCode, body }). The core logic is identical.
═══════════════════════════════════════════════════════════════════════════ */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// ── Tiny in-memory rate limiter (per warm instance) ──────────────────────────
// Not a hard guarantee across serverless instances, but combined with the
// honeypot + Resend's own limits it stops casual abuse. For strong limits back
// this with Upstash/Redis.
const HITS = new Map();                 // ip → [timestamps]
const WINDOW_MS = 60_000;               // 1 minute
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter(t => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const esc = (s) => clip(s, 5000)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const INTENT_LABELS = {
  placement: 'Placement / Role',
  freelance: 'Freelance / Project',
  exploring: 'Just exploring',
};

export default async function handler(req, res) {
  // ── Method guard ──
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse body (Vercel usually parses JSON; be defensive) ──
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { email, intent, message, _gotcha } = body;

  // ── Honeypot: a real user never fills this. Silently accept so bots get no
  //    signal, but send nothing. ──
  if (_gotcha) return res.status(200).json({ ok: true });

  // ── Validate ──
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'A valid e-mail is required.' });
  }
  if (message && String(message).length > 5000) {
    return res.status(400).json({ error: 'Message is too long.' });
  }

  // ── Rate limit ──
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Please try again shortly.' });
  }

  // ── Config check ──
  const KEY  = process.env.RESEND_API_KEY;
  const TO   = process.env.CONTACT_TO;
  const FROM = process.env.CONTACT_FROM || 'SHREY/OS Mail <onboarding@resend.dev>';
  if (!KEY || !TO) {
    console.error('contact: missing RESEND_API_KEY or CONTACT_TO env var');
    return res.status(500).json({ error: 'Mail is not configured yet. Please email me directly.' });
  }

  const intentLabel = INTENT_LABELS[intent] || 'General';
  const cleanEmail  = String(email).trim();
  const cleanMsg    = message ? String(message).trim() : '(no message — they used the vCard / just said hi)';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;line-height:1.55">
      <h2 style="margin:0 0 12px;color:#000080">📨 New SHREY/OS Mail</h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Regarding</td><td>${esc(intentLabel)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">From</td><td>${esc(cleanEmail)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #ddd;margin:14px 0"/>
      <div style="white-space:pre-wrap">${esc(cleanMsg)}</div>
      <hr style="border:none;border-top:1px solid #ddd;margin:14px 0"/>
      <p style="font-size:12px;color:#888;margin:0">Sent from the SHREY/OS Mail contact window.</p>
    </div>`;

  const text =
    `New SHREY/OS Mail\n\nRegarding: ${intentLabel}\nFrom: ${cleanEmail}\n\n${cleanMsg}\n`;

  // ── 1. SEND — the product. Nothing optional runs before this. ──
  try {
    const resend = new Resend(KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: cleanEmail,           // hit "Reply" and it goes straight to them
      subject: `[SHREY/OS] ${intentLabel} — ${cleanEmail}`,
      html,
      text,
    });
    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'Mail service rejected the message. Please email me directly.' });
    }
  } catch (err) {
    console.error('contact handler crashed:', err);
    return res.status(500).json({ error: 'Something went wrong sending. Please email me directly.' });
  }

  // ── 2. PERSIST — best-effort analytics. A missing env var or a Supabase
  //    hiccup must NEVER swallow a recruiter's message, so this runs after
  //    the send, behind its own guard + try/catch, and stores no raw IP.
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      await sb.from('contact_messages').insert({
        email: cleanEmail,
        intent: clip(intent, 32),
        message: message ? clip(String(message).trim(), 5000) : null,
      });
    } catch (err) {
      console.error('supabase persist failed (non-fatal):', err);
    }
  }

  return res.status(200).json({ ok: true });
}