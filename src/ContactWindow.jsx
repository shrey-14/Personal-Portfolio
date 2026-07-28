import { useRef, useState, useEffect, useCallback } from 'react';
import {
  PxCopy, PxGitHub, PxLinkedIn, PxFileText,
} from './PixelIcons.jsx';
import { OsMail } from './OsIcons.jsx';

/* ═══════════════════════════════════════════════════════════════════════════
   SHREY/OS · Mail — the Contact "application"
   ───────────────────────────────────────────────────────────────────────────
   Not a form-with-retro-paint. A Win95 mail client that opens after the dial-up
   sequence "connects". Two zones in one window:

     • vCard (outbound) — YOUR details, one click away. Copy Email, LinkedIn,
       GitHub, Download CV. A recruiter grabs the email and leaves happy having
       touched no form at all. This is the important half.

     • Compose (inbound) — the deliberately minimal channel: Email + Intent chip
       + optional Message. Three inputs, one of them optional, one a single tap.
       Wired to a serverless function (/api/contact → Resend).

   Every visible surface is driven by the same semantic CSS tokens the rest of
   SHREY/OS uses (--win-face, --field-bg, --tb-start …), so Dark (Midnight)
   themes it for free.

   ── CONFIG ────────────────────────────────────────────────────────────────
   Replace the CONTACT constants below with your real handles. The email is
   shown as selectable text AND used by the Copy button, so it never dead-ends
   even if JS or a mail client fails.
═══════════════════════════════════════════════════════════════════════════ */

// ── EDIT THESE ────────────────────────────────────────────────────────────────
/* Copy that actually copies: async Clipboard API first, then the classic
   hidden-textarea + execCommand fallback (still needed on some mobile
   browsers / non-HTTPS previews). Returns true only on real success, so
   "Copied" is never a lie. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const CONTACT = {
  name:      'Shrey Patel',
  role:      'MSc AI · Brunel University London',
  status:    'Seeking AI/ML placement · 2026–2027 · London / Remote',
  email:     'pshrey964@gmail.com',                       
  linkedin:  'https://www.linkedin.com/in/shreypatel-ai',     
  github:    'https://www.github.com/shrey-14',          
};
// Path to your CV in /public (or import it in HeroSection and pass as a prop —
// see the `cvHref` prop below, which takes priority when provided).
const CV_FALLBACK = '';

// The serverless endpoint. On Vercel this resolves to /api/contact.js.
const ENDPOINT = '/api/contact';

const INTENTS = [
  { id: 'placement', label: 'Placement / Role' },
  { id: 'freelance', label: 'Freelance / Project' },
  { id: 'exploring', label: 'Just exploring' },
];

/* Optional click sound hook — HeroSection owns the audio context. To keep this
   file drop-in and dependency-free we accept an onSound callback (defaults to a
   no-op). HeroSection passes its playClick / a soft "whoosh" through it. */
const noop = () => {};

// ── Small inline icons (crisp at any size, theme via currentColor) ───────────
/* All glyphs below come from the unified pixel icon system (PixelIcons.jsx). */
const IconCopy = () => <PxCopy size={24} className="mail-glyph" />;
const IconLinkedIn = () => <PxLinkedIn size={24} className="mail-glyph" />;
const IconGitHub = () => <PxGitHub size={24} className="mail-glyph" />;
const IconCV = () => <PxFileText size={24} className="mail-glyph" />;
const IconMail = () => <OsMail size={16} className="mail-title-ico" />;

const emailValid = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

// ═════════════════════════════════════════════════════════════════════════════
export default function ContactWindow({
  open,
  onClose,
  cvHref,                 // optional: imported CV asset from HeroSection
  onSound = noop,         // optional: () => void, played on interactions
  onSent  = noop,         // optional: notify parent a message went through
}) {
  const [intent,  setIntent]  = useState('placement');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState('idle');   // idle | sending | sent | error
  const [errText, setErrText] = useState('');
  const [copied,  setCopied]  = useState(false);
  const hpRef = useRef(null);                        // honeypot (bots fill it)
  const firstFieldRef = useRef(null);
  const dialogRef = useRef(null);
  const genRef = useRef(0);         // bumps on open/close — stale send() resolutions discard
  const openedAtRef = useRef(0);    // for the honeypot's speed check below

  const cv = cvHref || CV_FALLBACK;

  // Reset the compose state each time the window opens fresh. Also
  // invalidates any send() still in flight from a previous open/close —
  // without this, closing mid-send and reopening quickly could have a late
  // response silently flip the freshly-reset form to sent/error.
  useEffect(() => {
    genRef.current += 1;
    if (open) {
      openedAtRef.current = Date.now();
      setStatus('idle'); setErrText(''); setCopied(false);
      // focus the first field shortly after the open animation
      const t = setTimeout(() => firstFieldRef.current?.focus(), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc closes; basic focus trap keeps keyboard users inside the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([tabindex="-1"]):not([aria-hidden="true"]), textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const copyEmail = useCallback(async () => {
    onSound();
    const ok = await copyText(CONTACT.email);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      // both paths blocked — select the address for a manual Ctrl+C
      const el = document.getElementById('mail-email-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [onSound]);

  const send = useCallback(async () => {
    onSound();
    // A real visitor takes at least ~1.5s to reach Send; only an
    // implausibly-fast fill (a bot, not a stray autofill on the hidden
    // field's name) trips the honeypot — silent no-op, same as before.
    if (hpRef.current?.value && Date.now() - openedAtRef.current < 1500) return;
    if (!emailValid(email)) {
      setStatus('error');
      setErrText('Please enter a valid email so I can reply.');
      firstFieldRef.current?.focus();
      return;
    }
    setStatus('sending'); setErrText('');
    const gen = genRef.current;

    const payload = {
      email:   email.trim(),
      intent,
      intentLabel: INTENTS.find(i => i.id === intent)?.label || intent,
      message: message.trim(),
      // honeypot echoed for server-side check too
      _gotcha: hpRef.current?.value || '',
      ts: Date.now(),
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (genRef.current !== gen) return;   // closed/reopened while awaiting
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      if (genRef.current !== gen) return;
      setStatus('sent');
      onSent();
    } catch (err) {
      if (genRef.current !== gen) return;
      setStatus('error');
      setErrText(
        (err && err.message) ? err.message
        : 'Could not send. Please email me directly instead.');
    }
  }, [email, intent, message, onSound, onSent]);

  if (!open) return null;

  const busy = status === 'sending';

  return (
    <div className="dialog-back" onMouseDown={onClose}>
      <div
        className="mail-window"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="SHREY/OS Mail — Contact"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Titlebar (reuses the OS chrome classes) */}
        <div className="paint-titlebar">
          <IconMail />
          <span className="paint-title-txt">SHREY/OS Mail — New Message</span>
          <div className="paint-winbtns">
            <button className="win-btn win-close" aria-label="Close"
              onClick={() => { onSound(); onClose(); }}>✕</button>
          </div>
        </div>

        {/* Menubar — pure decoration, sells the "application" illusion */}
        <div className="mail-menubar" aria-hidden="true">
          {['Message', 'Insert', 'Format', 'Help'].map(m => (
            <span key={m} className="mail-menuitem">{m}</span>
          ))}
        </div>

        {status === 'sent' ? (
          <SentPanel email={email} onClose={onClose} onSound={onSound} />
        ) : (
          <div className="mail-body">
            {/* ── vCard: your details, the fast path ── */}
            <section className="mail-card" aria-label="Contact details">
              <div className="mail-card-head">
                <div className="mail-avatar" aria-hidden="true">
                  <OsMail size={32} className="mail-avatar-ico" />
                </div>
                <div className="mail-card-id">
                  <div className="mail-card-name">{CONTACT.name}</div>
                  <div className="mail-card-role">{CONTACT.role}</div>
                </div>
              </div>

              <div className="mail-status-line">
                <span className="mail-live-dot" aria-hidden="true" />
                <span>{CONTACT.status}</span>
              </div>

              <div className="mail-email-row">
                <span className="mail-email-label">E-mail:</span>
                <span id="mail-email-text" className="mail-email-text">{CONTACT.email}</span>
                <button className="mail-copy-btn" onClick={copyEmail}
                  aria-label="Copy email address">
                  <IconCopy /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="mail-actions">
                <a className="mail-action" href={CONTACT.linkedin}
                  target="_blank" rel="noopener noreferrer" onClick={onSound}>
                  <IconLinkedIn /> LinkedIn
                </a>
                <a className="mail-action" href={CONTACT.github}
                  target="_blank" rel="noopener noreferrer" onClick={onSound}>
                  <IconGitHub /> GitHub
                </a>
                {cv && (<a className="mail-action" href={cv} download onClick={onSound}>
                  <IconCV /> Download CV
                </a>)}
              </div>
            </section>

            <div className="mail-divider" />

            {/* ── Compose: the minimal inbound channel ── */}
            <section className="mail-compose" aria-label="Send a message">
              {/* Pre-addressed "To" — reinforces the mail-client metaphor */}
              <div className="mail-field mail-field-to">
                <label className="mail-flabel">To:</label>
                <div className="mail-to-pill">
                  <span className="mail-live-dot" aria-hidden="true" />
                  {CONTACT.email}
                </div>
              </div>

              {/* Intent chips — the "subject", but a single tap */}
              <div className="mail-field">
                <label className="mail-flabel">Regarding:</label>
                <div className="mail-chips" role="radiogroup" aria-label="What is this about?">
                  {INTENTS.map(opt => (
                    <button key={opt.id}
                      role="radio" aria-checked={intent === opt.id}
                      className={`mail-chip${intent === opt.id ? ' mail-chip-sel' : ''}`}
                      onClick={() => { onSound(); setIntent(opt.id); }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* From-email — the one required input */}
              <div className="mail-field">
                <label className="mail-flabel" htmlFor="mail-from">Your e-mail:</label>
                <input
                  id="mail-from"
                  ref={firstFieldRef}
                  type="email"
                  className="mail-input"
                  placeholder="you@company.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  disabled={busy}
                />
              </div>

              {/* Message — optional */}
              <div className="mail-field">
                <label className="mail-flabel" htmlFor="mail-msg">
                  Message <span className="mail-opt">(optional)</span>:
                </label>
                <textarea
                  id="mail-msg"
                  className="mail-textarea"
                  rows={4}
                  placeholder="A line about the role, team, or what caught your eye…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={busy}
                />
              </div>

              {/* Honeypot — hidden from humans, catches bots */}
              <input
                ref={hpRef}
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="mail-honeypot"
              />

              {status === 'error' && (
                <div className="mail-error" role="alert">
                  ⚠ {errText}{' '}
                  <a href={`mailto:${CONTACT.email}`} className="mail-error-link">
                    email me directly →
                  </a>
                </div>
              )}

              <div className="mail-sendrow">
                <span className="mail-sendhint">
                  {busy ? 'Transmitting…' : 'Only your e-mail is required.'}
                </span>
                <button className="mail-send" onClick={send} disabled={busy}>
                  {busy ? <span className="mail-spinner" aria-hidden="true" /> : <span className="mail-send-caret">▸</span>}
                  {busy ? 'Sending' : 'Send'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Success panel — the satisfying close-the-loop moment ─────────────────── */
function SentPanel({ email, onClose, onSound }) {
  return (
    <div className="mail-sent">
      <div className="mail-sent-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="56" height="56">
          <circle cx="24" cy="24" r="21" fill="none" stroke="#2e9e3f" strokeWidth="3"/>
          <path d="M14 24.5 L21 31.5 L34 17" fill="none" stroke="#2e9e3f"
            strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="mail-sent-title">Message sent</div>
      <p className="mail-sent-body">
        Thanks — it landed in my inbox. I read everything and reply to{' '}
        <b className='mail-id'>{email}</b> within friendly hours (usually within a day or two).
      </p>
      <button className="about-ok" onClick={() => { onSound(); onClose(); }}>  OK  </button>
    </div>
  );
}