/* ═══════════════════════════════════════════════════════════════════════════
   api/ask.js — SHREY/OS AI.TERMINAL backend (Vercel serverless)
   ───────────────────────────────────────────────────────────────────────────
   Proxies the Ask Shrey chat to Groq so the API key NEVER ships in the
   client bundle (a VITE_* key is readable by anyone in the built JS).
   Mirrors api/contact.js conventions: method guard, defensive parsing,
   per-instance rate limit, distinct status codes the client surfaces.

   Env: GROQ_API_KEY  (server-side only — no VITE_ prefix)
═══════════════════════════════════════════════════════════════════════════ */

const GROQ_MODEL    = 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/* Single source of truth for the persona — content strictly from the CV. */
const SYSTEM_PROMPT = `You are an AI assistant built into SHREY/OS — a portfolio OS for Shrey Patel.

ABOUT SHREY:
- MSc Artificial Intelligence, Brunel University London (Jan 2026 – Apr 2027, in progress)
- BEng Information Technology, LJ Institute — First Class with Distinction (2021–2025)
- Data Science Intern at Petpooja (Sep 2024 – May 2025): optimised 800+ BigQuery SQL pipelines (−30% latency), +15% OCR accuracy, NLP extraction pipelines
- Hackathon 1st Place: AI Kitchen Optimisation (Mar 2025) — YOLOv8 + LLaMA + XGBoost + Prophet
- AI Radar (May–Jun 2026): production RAG briefing platform, 260+ records/day, Hit@1 100%, FastAPI · Next.js · pgvector · Groq · Jina AI · Prefect · Supabase · Vercel · Railway
- Road Damage Detection (Mar–Apr 2024): YOLOv5, 87% mAP@0.5, PyTorch + OpenCV
- Seeking: AI/ML placement 2026–27, London or remote
- Contact: pshrey964@gmail.com | linkedin.com/in/shreypatel-ai | github.com/shrey-14

RULES:
- Answer questions about Shrey's work, skills, projects, and fit for roles
- Be factual — only use information above, never invent details
- Be concise but complete — this is a terminal interface
- Use a direct, confident tone. No fluff. No disclaimers
- If asked something unrelated to Shrey, briefly redirect to portfolio topics`;

/* Honest per-instance limiter (same caveats as contact.js: resets on cold
   start, per-region — fine as a first line against casual abuse). */
const hits = new Map();
const LIMIT = 20;            // requests
const WINDOW = 10 * 60_000;  // per 10 minutes per IP

const clip = (s, n) => String(s).slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) {
    console.error('ask: GROQ_API_KEY not configured');
    return res.status(500).json({ error: 'AI endpoint not configured.' });
  }

  // rate limit
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > WINDOW) { rec.n = 0; rec.t = now; }
  rec.n += 1; hits.set(ip, rec);
  if (rec.n > LIMIT) {
    return res.status(429).json({ error: 'Too many questions — give the terminal a minute.' });
  }

  // defensive body parse + strict message validation
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const raw = Array.isArray(body?.messages) ? body.messages : null;
  if (!raw || raw.length === 0 || raw.length > 16) {
    return res.status(400).json({ error: 'Bad request.' });
  }
  const messages = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: clip(m.content, 2000) }))
    .slice(-8);
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Bad request.' });
  }

  try {
    const r = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 512,
        temperature: 0.7,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });
    if (!r.ok) {
      console.error('ask: groq status', r.status);
      return res.status(502).json({ error: 'Model backend rejected the request.' });
    }
    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '';
    if (!answer) return res.status(502).json({ error: 'Empty response from model.' });
    return res.status(200).json({ answer });
  } catch (err) {
    console.error('ask handler crashed:', err);
    return res.status(500).json({ error: 'AI endpoint error.' });
  }
}
