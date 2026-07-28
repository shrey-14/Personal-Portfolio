/* ══════════════════════════════════════════════════════════════════════════
   ContactSection.jsx — SHREY/OS section 07
   ──────────────────────────────────────────────────────────────────────────
   A scroll anchor that gives the Contact experience a visible page presence.
   Layout: one unified Win95 window (no dividing lines) containing three
   areas that read as a natural whole:
     1. Terminal address row  — C:\MAIL> email + copy
     2. Primary CTA          — "Open SHREY/OS Mail" (triggers existing
                               dial-up → ContactWindow flow via handleAction)
     3. Quick links row       — LinkedIn · GitHub · CV.pdf

   Does NOT duplicate the ContactWindow logic — it calls os.handleAction
   ('contact') exactly as the desktop icon does.
   ══════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useOS, playClick, cvHref as cvDefault } from './OSContext';
import { OsMail }            from './OsIcons';
import {
  PxCopy, PxGitHub, PxLinkedIn, PxFileText,
} from './PixelIcons';

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

const EMAIL    = 'pshrey964@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/shreypatel-ai';
const GITHUB   = 'https://www.github.com/shrey-14';

export default function ContactSection({ cvHref }) {
  const os = useOS();
  const cv = cvHref || cvDefault;   // real CV asset by default
  const rootRef = useRef(null);

  /* Launcher pulse: Start menu / desktop launchers scroll here and flash the
     window with the phosphor border — same pattern as the Projects cabinet. */
  useEffect(() => {
    const handler = () => {
      const el = rootRef.current?.querySelector('.ct-win');
      if (!el) return;
      el.classList.add('ct-win-flash');
      setTimeout(() => el.classList.remove('ct-win-flash'), 1800);
    };
    window.addEventListener('shreyos-contact-boot', handler);
    return () => window.removeEventListener('shreyos-contact-boot', handler);
  }, []);
  const [copied, setCopied] = useState(false);

  /* The one focal moment for this section: the address terminal-types
     itself in once, first time Contact becomes visible — the same voice
     as the boot log / AI.TERMINAL, not a generic fade-and-rise (the section
     already gets that from .ct-in below too; this is the distinct beat on
     top of it, matching "you've reached the end, here's the address"). */
  const [typedLen, setTypedLen] = useState(os.reducedMotion ? EMAIL.length : 0);
  const typedOnce = useRef(false);

  /* reveal on scroll */
  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add('ct-in');
        if (typedOnce.current || os.reducedMotion) return;
        typedOnce.current = true;
        let i = 0;
        const id = setInterval(() => {
          i += 1;
          setTypedLen(i);
          if (i >= EMAIL.length) clearInterval(id);
        }, 38);
      },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [os.reducedMotion]);

  const copyEmail = useCallback(async () => {
    playClick();
    // Finish the type-in instantly — the manual-selection fallback below
    // reads the live DOM text, which would be truncated mid-animation.
    setTypedLen(EMAIL.length);
    const ok = await copyText(EMAIL);
    if (ok) {
      setCopied(true);                      // only claim success truthfully
      setTimeout(() => setCopied(false), 2000);
    } else {
      // both clipboard paths blocked — select the address for manual Ctrl+C
      const sel = window.getSelection();
      const el = document.querySelector('.ct-addr-email');
      if (sel && el) {
        const r = document.createRange();
        r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
      }
    }
  }, []);

  const openMail = () => {
    playClick();
    // Same dial-up handshake gate as the 'contact' action (desktop icon /
    // Start menu) — both just open the compose window, see
    // runDialupHandshake in OSContext.jsx.
    os.handleAction('contact_mail');
  };

  return (
    <section id="contact" className="ct-section" ref={rootRef}>
      <div className="ct-inner">

        {/* section header — same pattern as every other section */}
        <header className="ct-break">
          <span className="ct-idx">07</span>
          <span className="ct-title">Contact</span>
          <span className="ct-sub">// mail.exe — ready to send</span>
          <span className="ct-rule" />
        </header>

        {/* single unified Win95 window */}
        <div className="ct-win">

          {/* titlebar */}
          <div className="ct-titlebar">
            <OsMail size={14} className="ct-tico" aria-hidden="true" />
            <span className="ct-titletxt">SHREY/OS Mail — Outbox</span>
            <span className="ct-live-dot" aria-hidden="true" />
            <div className="ct-winbtns">
              <button className="win-btn" aria-hidden="true" tabIndex={-1}>_</button>
              <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
              <button className="win-btn win-close" aria-hidden="true" tabIndex={-1}>✕</button>
            </div>
          </div>

          {/* menubar */}
          <div className="ct-menubar">
            <span className="ct-menu-item">File</span>
            <span className="ct-menu-item">View</span>
            <span className="ct-menu-item">Tools</span>
            <span className="ct-menu-item">Help</span>
            <span className="ct-menu-spacer" />
            <span className="ct-menu-status">
              <span className="ct-menu-dot" aria-hidden="true" />
              Seeking AI/ML placement · 2026–27
            </span>
          </div>

          {/* body — one surface, three naturally separated areas */}
          <div className="ct-body">

            {/* ── area 1: terminal address ── */}
            <div className="ct-area ct-area-address">
              <div className="ct-addr-label">From · Address</div>
              <div className="ct-addr-row">
                <span className="ct-addr-pfx">C:\MAIL&gt;&nbsp;</span>
                <span className="ct-addr-email" aria-label={`Email: ${EMAIL}`}>
                  {EMAIL.slice(0, typedLen)}
                  {typedLen < EMAIL.length && <span className="ct-caret" aria-hidden="true" />}
                </span>
                <button className="ct-copy-btn" onClick={copyEmail}
                  aria-label={copied ? 'Copied!' : 'Copy email address'}>
                  {copied
                    ? <><PxCopy size={14} aria-hidden="true" /> Copied ✓</>
                    : <><PxCopy size={14} aria-hidden="true" /> Copy</>}
                </button>
              </div>
              <div className="ct-addr-status">
                <span className="ct-status-dot" aria-hidden="true" />
                <span>MAIL SERVER READY</span>
                <span className="ct-status-sep">·</span>
                <span>SEEKING AI/ML PLACEMENT 2026–27</span>
                <span className="ct-status-sep">·</span>
                <span>LONDON / REMOTE</span>
              </div>
            </div>

            {/* ── area 2: primary CTA ── */}
            <div className="ct-area ct-area-cta">
              <div className="ct-cta-copy">
                <div className="ct-cta-heading">Send a message via SHREY/OS Mail</div>
                <div className="ct-cta-hint">Dial-up → connect → compose → send</div>
              </div>
              <button className="ct-cta-btn" onClick={openMail} aria-label="Open SHREY/OS Mail client">
                <OsMail size={16} aria-hidden="true" />
                Open SHREY/OS Mail
              </button>
            </div>

            {/* ── area 3: quick links — same prominence, no dividing line ── */}
            <div className="ct-area ct-area-links">
              <a className="ct-link" href={LINKEDIN} target="_blank" rel="noopener noreferrer"
                onClick={playClick} aria-label="LinkedIn profile">
                <PxLinkedIn size={24} aria-hidden="true" />
                <span>LinkedIn</span>
              </a>
              <a className="ct-link" href={GITHUB} target="_blank" rel="noopener noreferrer"
                onClick={playClick} aria-label="GitHub profile">
                <PxGitHub size={24} aria-hidden="true" />
                <span>GitHub</span>
              </a>
              {cv && (
                <a className="ct-link"
                  href={cv}
                  download="Shrey_Patel_CV.pdf"
                  onClick={playClick}
                  aria-label="Download CV">
                  <PxFileText size={24} aria-hidden="true" />
                  <span>CV.pdf</span>
                </a>
              )}
            </div>

          </div>{/* /ct-body */}

          {/* statusbar */}
          <div className="ct-statusbar">
            <span className="ct-sb">{EMAIL}</span>
            <span className="ct-sb">Brunel University London</span>
            <span className="ct-sb ct-sb-grow" />
            <span className="ct-sb ct-sb-online">● ONLINE</span>
          </div>

        </div>{/* /ct-win */}
      </div>
    </section>
  );
}