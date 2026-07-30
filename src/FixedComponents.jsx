/* ══════════════════════════════════════════════════════════════════════════
   FixedComponents.jsx — the persistent OS shell that lives ABOVE every section
   (hero, skills, projects…). Renders once, wraps all sections, and hosts the
   reusable/fixed pieces: custom cursor, screensaver, BSOD, context menu, About,
   dial-up, Mail (contact), Display Properties, desktop icons and the taskbar.

   Usage:  <FixedComponents><HeroSection/><SkillsSection/></FixedComponents>

   The desktop shell is gated to !isMobile; on mobile the hero renders its own
   self-contained menu/overlays, so nothing double-renders.
   ═════════════════════════════════════════════════════════════════════════ */
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRTShutdownAnimation } from './CRTBootAnimation.jsx';
import {
  useOS, playClick, playDialup, playWhoosh,
  WIN98, DESKTOP_ICONS, cvHref,
} from './OSContext';
import ContactWindow from './ContactWindow';
import ProjectsWindow from './ProjectsWindow';
import {
  PxAppWindows, PxLightbulb, PxLightbulbOff, PxVolume, PxVolumeMute, PxSignal,
} from './PixelIcons.jsx';
import {
  OsComputer, OsFolder, OsPdf, OsMail, OsShutdown, OsHelp, OsRecycleBin, OsText,
  OsPaint, OsTextEditor, OsSettings, OsDisplaySet, OsSysMonitor, OsProfiler, OsTerminal,
} from './OsIcons.jsx';

function DotRingCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.body.classList.add('cursor-hidden');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = null;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dotRef.current) {
        // 9px dot → offset by 4.5 to centre on the pointer.
        dotRef.current.style.transform = `translate(${mx - 4.5}px, ${my - 4.5}px)`;
      }
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        // 36px ring → offset by 18 to centre.
        ringRef.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    /* AUDIT §2.3 — INTERACTIVE CURSOR STATE
       One document-level listener via event bubbling instead of thousands
       of per-element registrations that would rot the moment new elements
       mount. body.cursor-hover toggles from the CSS side (see global.css). */
    const INTERACTIVE = 'button, a, [role="button"], input, textarea, select, .pj-app, .sk-row, .at-sug, .bin-row';
    const onOver = (e) => {
      if (e.target.closest && e.target.closest(INTERACTIVE)) {
        document.body.classList.add('cursor-hover');
      }
    };
    const onOut = (e) => {
      if (e.target.closest && e.target.closest(INTERACTIVE)) {
        document.body.classList.remove('cursor-hover');
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove('cursor-hidden');
      document.body.classList.remove('cursor-hover');
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}

// ── Desktop Icon ──────────────────────────────────────────────────────────────
function DesktopIcon({ icon, onDblClick }) {
  const [sel, setSel] = useState(false);
  const iconRef = useRef(null);

  const handleClick    = () => { playClick(); setSel(true); setTimeout(() => setSel(false), 380); };
  const handleDblClick = () => {
    onDblClick?.(icon);
    // Downloadable icons (Resume) trigger their download on DOUBLE click —
    // same activation model as every other desktop icon.
    if (icon.download && icon.href) {
      const a = document.createElement('a');
      a.href = icon.href; a.download = icon.download; a.click();
    }
  };

  /* Magnetic pull: as the cursor nears the icon it leans a few px toward it and
     its label glow lifts. Pure transform on the inner frame → compositor-cheap.
     Only active on fine pointers without reduced-motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = iconRef.current;
    if (!el) return;
    const RADIUS = 90;      // px within which the pull engages
    const MAX    = 5;       // px max lean
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0, engaged = false;

    /* Cached icon centre — the icons are in a fixed layer, so their rect only
       changes on resize (recompute lazily instead of on every mousemove). */
    let mx = 0, my = 0, rectValid = false;
    const readRect = () => {
      const r = el.getBoundingClientRect();
      mx = r.left + r.width / 2; my = r.top + r.height / 2; rectValid = true;
    };
    const invalidate = () => { rectValid = false; };
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, { passive: true });

    const onMove = (e) => {
      if (!rectValid) readRect();
      const dx = e.clientX - mx, dy = e.clientY - my;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        const f = (1 - dist / RADIUS);          // 0..1, stronger when closer
        cx = (dx / RADIUS) * MAX * f * 2;
        cy = (dy / RADIUS) * MAX * f * 2;
        if (!engaged) { engaged = true; el.classList.add('icon-magnetized'); }
      } else if (engaged) {
        cx = 0; cy = 0; engaged = false; el.classList.remove('icon-magnetized');
      }
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = null;
      tx += (cx - tx) * 0.18; ty += (cy - ty) * 0.18;
      const frame = el.querySelector('.icon-frame');
      if (frame) frame.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('scroll', invalidate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const DeskIco = WIN98[icon.id];
  const Inner = (
    <>
      <div className={`icon-frame${sel ? ' icon-sel' : ''}`}>
        <DeskIco className="icon-img" size={48} />
      </div>
      <span className="icon-label">{icon.label}</span>
    </>
  );

  return (
    <div className="desktop-icon" ref={iconRef} data-iconid={icon.id}>
      <button className="desktop-icon-inner" aria-label={icon.label}
        onClick={handleClick} onDoubleClick={handleDblClick}>
        {Inner}
      </button>
    </div>
  );
}

// ── BSOD ─────────────────────────────────────────────────────────────────────
function BSODScreen({ open, onDismiss }) {
  useEffect(() => {
    if (!open) return;
    const handler = () => onDismiss();
    document.addEventListener('keydown', handler);
    document.addEventListener('click', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('click', handler);
    };
  }, [open, onDismiss]);

  if (!open) return null;
  return (
    <div className="bsod">
      <div className="bsod-content">
        <div className="bsod-title">SHREY/OS</div>
        <br />
        <p>A problem has been detected and SHREY/OS has been shut down to</p>
        <p>prevent damage to your career prospects.</p>
        <br />
        <div className="bsod-stop">RESUME_NOT_FOUND_EXCEPTION</div>
        <br />
        <p>If this is the first time you've seen this stop error screen,</p>
        <p>check out my projects. If it appears again, you should</p>
        <p>probably hire me before someone else does.</p>
        <br />
        <p>Technical information:</p>
        <p>*** STOP: 0x000000SP (0xSHREY, 0xPATEL, 0xAI, 0xML)</p>
        <br />
        <div className="bsod-hint">Press any key to restart SHREY/OS...</div>
      </div>
    </div>
  );
}

// ── Screensaver ───────────────────────────────────────────────────────────────
function Screensaver({ active, onDismiss }) {
  const canvasRef = useRef(null);
  const posR = useRef({ x: 120, y: 80, vx: 2.3, vy: 1.7 });
  const colorIdxR = useRef(0);

  const COLORS = ["#fff", "#39FF14", "#00cfff", "#ff4e8e", "#ffce00"];

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const dismiss = () => onDismiss();

    document.addEventListener("mousemove", dismiss);
    document.addEventListener("keydown", dismiss);
    document.addEventListener("click", dismiss);
    document.addEventListener("touchstart", dismiss);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0;
    let H = 0;

    const TEXT = "SHREY/OS";
    const FONT_SIZE = 50;

    let TW = 0;
    let ascent = 0;
    let descent = 0;

    function updateMetrics() {
      ctx.font = `${FONT_SIZE}px "Press Start 2P", monospace`;

      const m = ctx.measureText(TEXT);

      TW = m.width;
      ascent = m.actualBoundingBoxAscent || FONT_SIZE;
      descent = m.actualBoundingBoxDescent || 0;
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;

      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);

      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      updateMetrics();

      // Keep text inside screen after resize
      const p = posR.current;
      p.x = Math.min(Math.max(0, p.x), W - TW);
      p.y = Math.min(Math.max(ascent, p.y), H - descent);
    }

    async function init() {
      // Wait until the font has actually loaded.
      if (document.fonts) {
        try {
          await document.fonts.load(`${FONT_SIZE}px "Press Start 2P"`);
        } catch {}
      }

      resize();
    }

    init();

    window.addEventListener("resize", resize);

    let raf;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const p = posR.current;

      ctx.font = `${FONT_SIZE}px "Press Start 2P", monospace`;
      ctx.fillStyle = COLORS[colorIdxR.current % COLORS.length];
      ctx.fillText(TEXT, p.x, p.y);

      p.x += p.vx;
      p.y += p.vy;

      let bounced = false;

      // LEFT
      if (p.x <= 0) {
        p.x = 0;
        p.vx *= -1;
        bounced = true;
      }

      // RIGHT
      if (p.x + TW >= W) {
        p.x = W - TW;
        p.vx *= -1;
        bounced = true;
      }

      // TOP
      if (p.y - ascent <= 0) {
        p.y = ascent;
        p.vy *= -1;
        bounced = true;
      }

      // BOTTOM
      if (p.y + descent >= H) {
        p.y = H - descent;
        p.vy *= -1;
        bounced = true;
      }

      if (bounced) {
        colorIdxR.current++;
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);

      document.removeEventListener("mousemove", dismiss);
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("click", dismiss);
      document.removeEventListener("touchstart", dismiss);

      window.removeEventListener("resize", resize);
    };
  }, [active, onDismiss]);

  if (!active) return null;

  return <canvas ref={canvasRef} className="screensaver" />;
}

// ── Dial-up overlay ───────────────────────────────────────────────────────────
function DialupOverlay({ phase }) {
  const [baud, setBaud] = useState(0);
  const done = phase === 'CONNECTED!';

  useEffect(() => {
    const target = 56000;   // V.90 ceiling — real modems topped at 56,000 bps
    let curr = 0;
    const id = setInterval(() => {
      curr = Math.min(curr + Math.floor(Math.random() * 2800 + 400), target);
      setBaud(curr);
      if (curr >= target) clearInterval(id);
    }, 75);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dialog-back">
      <div className="about-dialog dialup-dialog">
        <div className="paint-titlebar">
          <span className="paint-title-txt">Connecting to mail.shreyos.net...</span>
        </div>
        <div className="dialup-body">
          <div className="dialup-icon-row">
            <svg viewBox="0 0 32 20" width="48" className="dialup-icon-svg">
              <rect x="0" y="2" width="13" height="10" rx="1" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
              <rect x="1" y="3" width="11" height="8" fill={done ? '#00b300' : '#000080'}/>
              <rect x="5" y="12" width="3" height="4" fill="#909090"/>
              <rect x="3" y="16" width="7" height="2" fill="#c0c0c0" stroke="#000" strokeWidth="0.4"/>
              <line x1="13" y1="7" x2="19" y2="7" stroke="#000" strokeWidth="0.8" strokeDasharray="2,1"/>
              <rect x="19" y="2" width="13" height="10" rx="1" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
              <rect x="20" y="3" width="11" height="8" fill="#000080"/>
              <rect x="24" y="12" width="3" height="4" fill="#909090"/>
              <rect x="22" y="16" width="7" height="2" fill="#c0c0c0" stroke="#000" strokeWidth="0.4"/>
            </svg>
            <div className="dialup-info">
              <div className="dialup-host">mail.shreyos.net</div>
              <div className="dialup-speed">{baud.toLocaleString()} bps</div>
            </div>
          </div>
          <div className={`dialup-status${done ? ' dialup-done' : ''}`}>{phase}</div>
          <div className="dialup-bar-wrap">
            <div className="dialup-bar">
              <div className="dialup-fill"
                   style={{ clipPath:`inset(0 ${100 - Math.round((baud/56000)*100)}% 0 0)` }} />
            </div>
          </div>
          <div className="dialup-hint">Please wait while connecting...</div>
        </div>
      </div>
    </div>
  );
}

const CTX_ITEMS = [
  { label:'Arrange Icons', sub:true }, { label:'Line up Icons' },
  null,
  { label:'Paste' }, { label:'Paste Shortcut' },
  null,
  { label:'New', sub:true },
  null,
  { label:'Properties', action:'sysinfo' },
];

function ContextMenu({ pos, onAction, onClose }) {
  useEffect(() => {
    if (!pos) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pos, onClose]);

  if (!pos) return null;
  // Clamp against the menu's DERIVED size, not a hardcoded guess —
  // rows ≈ 22px, dividers ≈ 8px, chrome ≈ 8px.
  const MENU_W = 190;
  const MENU_H = CTX_ITEMS.reduce((h, it) => h + (it === null ? 8 : 22), 8);
  const left = Math.min(pos.x, window.innerWidth  - MENU_W);
  const top  = Math.min(pos.y, window.innerHeight - MENU_H);
  /* Scale out of the cursor, not the menu's centre. Measured against the
     CLAMPED box: near a screen edge the menu slides back from pos, so the
     click point is no longer its top-left corner.
     The key remounts the menu per position, so a second right-click somewhere
     else replays the open from the new origin instead of teleporting. */
  return (
    <div className="ctx-menu"
         key={`${left},${top}`}
         style={{ left, top, '--ctx-ox': `${pos.x - left}px`, '--ctx-oy': `${pos.y - top}px` }}>
      {CTX_ITEMS.map((item, i) =>
        item === null
          ? <div key={i} className="ctx-div" />
          : (
            <button key={i} className="ctx-item"
              onClick={() => { playClick(); if (item.action) onAction(item.action); onClose(); }}>
              <span>{item.label}</span>
              {item.sub && <span className="ctx-arrow">▶</span>}
            </button>
          )
      )}
    </div>
  );
}

function AboutDialog({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const close = () => { playClick(); onClose(); };
  return (
    <div className="dialog-back" onMouseDown={close}>
      {/* Same window language as System Monitor / Training Monitor:
          22px gradient titlebar, menubar, panel headers, bevelled
          statusbar cells — not the old flat mini-dialog. */}
      <div className="syswin syswin-about" onMouseDown={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="about-dialog-title">
        <div className="syswin-tb">
          <OsComputer className="syswin-tico" size={16} />
          <span className="syswin-tt" id="about-dialog-title">My Computer — System Properties</span>
          <div className="syswin-btns">
            <button className="win-btn" aria-hidden="true" tabIndex={-1}>_</button>
            <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
            <button className="win-btn win-close" aria-label="Close" onClick={close}>✕</button>
          </div>
        </div>

        <div className="syswin-mb">
          <span>File</span><span>Edit</span><span>View</span><span>Help</span>
          <span className="syswin-mb-sp" />
          <span className="syswin-mb-tag">
            <span className="syswin-dot" />system: nominal
          </span>
        </div>

        <div className="syswin-body">
          <div className="syswin-hero">
            <OsComputer size={32} className="syswin-hero-ico" />
            <div>
              <div className="syswin-hero-name">SHREY/OS</div>
              <div className="syswin-hero-sub">Version 2.0 · Build 2026.07.03</div>
            </div>
          </div>

          <div className="syswin-panel">
            <div className="syswin-ph"><span className="syswin-tw">▼</span>System</div>
            <div className="syswin-rows">
              <div className="syswin-row"><span>Registered to</span><b>Shrey Patel</b></div>
              <div className="syswin-row"><span>Reading</span><b>MSc Artificial Intelligence</b></div>
              <div className="syswin-row"><span>Institution</span><b>Brunel University London</b></div>
              <div className="syswin-row"><span>Term</span><b>Jan 2026 — Apr 2027</b></div>
              <div className="syswin-row"><span>Status</span><b className="syswin-live">SEEKING PLACEMENT · 2026–27</b></div>
            </div>
          </div>

          <div className="syswin-panel">
            <div className="syswin-ph"><span className="syswin-tw">▼</span>Resources</div>
            <div className="syswin-rows">
              <div className="syswin-row"><span>Processor</span><b>Python 3.11 · PyTorch</b></div>
              <div className="syswin-row"><span>Memory</span><b>RAG · pgvector · Jina AI</b></div>
              <div className="syswin-row"><span>System</span><b>FastAPI · Supabase · Next.js</b></div>
              <div className="syswin-row"><span>Display</span><b>React · Vite · Plotly</b></div>
              <div className="syswin-row"><span>Network</span><b>Vercel · Railway · Prefect</b></div>
            </div>
          </div>

          <div className="syswin-panel">
            <div className="syswin-ph"><span className="syswin-tw">▼</span>Credits</div>
            <div className="syswin-credits">
              <p>Icons: SerenityOS project (BSD-2-Clause) · Pixelarticons (MIT)</p>
              <p>Brand marks: HackerNoon Pixel Icon Library (CC BY 4.0)</p>
              <p>Type: IBM Plex · Chakra Petch · Press Start 2P</p>
              <p>Built with React · Vite · no animation libraries.</p>
            </div>
          </div>
        </div>

        <div className="syswin-sbar">
          <span className="syswin-sb">SHREY/OS v2.0</span>
          <span className="syswin-sb">© 2026 Shrey Patel</span>
          <span className="syswin-sb syswin-sb-grow" />
          <span className="syswin-sb"><b>MSc AI</b> · Brunel</span>
        </div>
      </div>
    </div>
  );
}

const START_ITEMS = [
  { Ico: OsFolder,   label:'Projects',     action:'projects' },
  { Ico: OsPdf,      label:'Resume',       href:cvHref, download:'Shrey_Patel_CV.pdf' },
  { Ico: OsMail,     label:'Contact',      action:'contact' },
  { Ico: OsHelp,     label:'About',        action:'about' },
  null,
  { Ico: OsShutdown, label:'Shut Down...', action:'shutdown' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   RECYCLE BIN — "cut/" : the ideas that didn't survive SHREY/OS.
   Every entry is a real decision made while building this site, with the
   reason it was binned. A portfolio shows what you shipped; the bin shows
   what you were willing to throw away — which is the harder signal.
═══════════════════════════════════════════════════════════════════════════ */
const RECYCLE_ITEMS = [
  {
    id: 'defrag',
    name: 'disk_defragmenter.concept',
    type: 'Section concept',
    size: '— ',
    date: '12 Jun 2026',
    was: 'Journey · v1',
    why: 'The Journey section was going to be a defrag screen. But defrag tells a story of "scattered → contiguous", and a training run tells one of "high error → low error". The metaphor was fighting the content, so the whole concept went in the bin and became a loss curve instead.',
  },
  {
    id: 'signalwall',
    name: 'signal_wall.jsx',
    type: 'Component',
    size: '14 KB',
    date: '08 Jul 2026',
    was: 'Projects · v3',
    why: 'Four CRT monitors on a rack, each playing a live project feed. It looked good and belonged to a different universe — this site is an operating system, so the work should live in windows, not in borrowed hardware.',
  },
  {
    id: 'floppy',
    name: 'floppy_archive.jsx',
    type: 'Component',
    size: '11 KB',
    date: '02 Jul 2026',
    was: 'Projects · v1',
    why: 'Four identical beige rectangles where only the label text changed, static until clicked. The container had become more interesting than the projects inside it.',
  },
  {
    id: 'wallpapers',
    name: 'wallpapers/',
    type: 'Folder · 6 files',
    size: '23.1 MB',
    date: '05 Jul 2026',
    was: 'Display Properties',
    why: 'Six raster wallpapers — one of them 16 MB — shipping on every deploy of a portfolio that argues for performance. Replaced by generative backdrops drawn in canvas at a few kilobytes.',
  },
  {
    id: 'teal',
    name: 'teal_desktop.css',
    type: 'Stylesheet',
    size: '2 KB',
    date: '28 Jun 2026',
    was: 'Global theme',
    why: '#008080 is Windows\u2019 teal, not mine. Graphite keeps the retro read while letting the amber accent and phosphor green do the talking.',
  },
  {
    id: 'details',
    name: 'skills_details_tab.jsx',
    type: 'Component',
    size: '6 KB',
    date: '19 Jul 2026',
    was: 'Skills · tab 3',
    why: 'A third tab listing education and experience — both of which already had better homes in About and Journey. Two exceptional tabs beat three uneven ones.',
  },
  {
    id: 'comicsans',
    name: 'comic_sans.ttf',
    type: 'Font file',
    size: '64 KB',
    date: '\u2014',
    was: 'Never installed',
    why: 'No notes.',
  },
];

function RecycleBinDialog({ open, onClose }) {
  const [sel, setSel] = useState(RECYCLE_ITEMS[0].id);
  const [note, setNote] = useState(null);
  const noteT = useRef(null);

  useEffect(() => () => clearTimeout(noteT.current), []);
  useEffect(() => { if (open) { setSel(RECYCLE_ITEMS[0].id); setNote(null); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const cur = RECYCLE_ITEMS.find(i => i.id === sel) || RECYCLE_ITEMS[0];
  const close = () => { playClick(); onClose(); };

  const say = msg => {
    playClick();
    setNote(msg);
    clearTimeout(noteT.current);
    noteT.current = setTimeout(() => setNote(null), 3600);
  };

  return (
    <div className="dialog-back" onMouseDown={close}>
      <div className="syswin syswin-bin" onMouseDown={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="bin-dialog-title">
        <div className="syswin-tb">
          <OsRecycleBin className="syswin-tico" size={16} />
          <span className="syswin-tt" id="bin-dialog-title">Recycle Bin — C:\SHREYOS\cut</span>
          <div className="syswin-btns">
            <button className="win-btn" aria-hidden="true" tabIndex={-1}>_</button>
            <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
            <button className="win-btn win-close" aria-label="Close" onClick={close}>✕</button>
          </div>
        </div>

        <div className="syswin-mb">
          <span>File</span><span>Edit</span><span>View</span><span>Help</span>
          <span className="syswin-mb-sp" />
          <span className="syswin-mb-tag">{RECYCLE_ITEMS.length} objects</span>
        </div>

        <div className="bin-toolbar">
          <button className="bin-tb-btn"
            onClick={() => say('Restore is disabled. These were deleted on purpose.')}>
            Restore item
          </button>
          <button className="bin-tb-btn"
            onClick={() => say('Kept. A bin you can read is worth more than an empty one.')}>
            Empty Recycle Bin
          </button>
          <span className="bin-tb-sp" />
          <span className="bin-tb-hint">Select an item to see why it was cut</span>
        </div>

        <div className="bin-body">
          <div className="bin-list" role="listbox" aria-label="Deleted items">
            <div className="bin-cols">
              <span>Name</span><span className="bin-c-type">Type</span>
              <span className="bin-c-size">Size</span><span className="bin-c-date">Deleted</span>
            </div>
            <div className="bin-rows">
              {RECYCLE_ITEMS.map(it => (
                <button
                  key={it.id}
                  role="option"
                  aria-selected={sel === it.id}
                  className={`bin-row${sel === it.id ? ' bin-row-sel' : ''}`}
                  onClick={() => { playClick(); setSel(it.id); }}>
                  <span className="bin-nm">
                    <OsText className="bin-nm-ico" size={16} />
                    <span className="bin-nm-txt">{it.name}</span>
                  </span>
                  <span className="bin-c-type">{it.type}</span>
                  <span className="bin-c-size">{it.size}</span>
                  <span className="bin-c-date">{it.date}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bin-detail">
            <div className="syswin-ph"><span className="syswin-tw">▼</span>Properties</div>
            <div className="bin-detail-in">
              <div className="bin-d-name">{cur.name}</div>
              <div className="bin-d-meta">
                <span>{cur.was}</span><span className="bin-d-dot">·</span>
                <span>deleted {cur.date}</span>
              </div>
              <div className="bin-d-label">Reason for deletion</div>
              <p className="bin-d-why" key={cur.id}>{cur.why}</p>
            </div>
          </div>
        </div>

        <div className="syswin-sbar">
          <span className="syswin-sb">{RECYCLE_ITEMS.length} object(s)</span>
          <span className="syswin-sb">23.2 MB</span>
          <span className={`syswin-sb syswin-sb-grow${note ? ' bin-note' : ''}`}>{note || ''}</span>
          <span className="syswin-sb"><b>cut/</b> · kept on purpose</span>
        </div>
      </div>
    </div>
  );
}

function StartMenu({ open, onAction, onClose }) {
  if (!open) return null;
  return (
    <div className="start-menu">
      <div className="start-strip"><span className="start-brand">SHREY/OS</span></div>
      <div className="start-items">
        {START_ITEMS.map((item, i) =>
          item === null
            ? <div key={i} className="ctx-div" />
            : item.download
              ? (
                <a key={i} href={item.href} download={item.download} className="start-item"
                  onClick={() => { playClick(); onClose(); }}>
                  <item.Ico className="si-icon" size={24} />
                  <span>{item.label}</span>
                </a>
              )
              : (
                <button key={i} className="start-item"
                  onClick={() => {
                    playClick();
                    if (item.action) onAction(item.action);
                    else if (item.href) window.location.hash = item.href.replace('#','');
                    onClose();
                  }}>
                  <item.Ico className="si-icon" size={24} />
                  <span>{item.label}</span>
                </button>
              )
        )}
      </div>
    </div>
  );
}

function TrayNetwork() {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setFlash(true); setTimeout(() => setFlash(false), 280); }, 3200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`tray-net${flash ? ' tray-net-flash' : ''}`} title="Network: connected" aria-hidden="true">
      <PxSignal size={24} />
    </span>
  );
}

function DisplayProperties({ open, onClose, theme, wallpaperId, onApply }) {
  const [tab, setTab]         = useState('Appearance');
  // Draft state — what the dialog is previewing, not yet committed.
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftWp,    setDraftWp]    = useState(wallpaperId);
  const [dirty,      setDirty]      = useState(false);

  // Re-sync drafts to the committed values every time the dialog opens.
  useEffect(() => {
    if (open) { setDraftTheme(theme); setDraftWp(BG_IDS.includes(wallpaperId) ? wallpaperId : 'starfield'); setDirty(false); }
  }, [open, theme, wallpaperId]);

  const wp = BG_MODES.find(w => w.id === draftWp) || BG_MODES[0];

  const commit = () => { onApply(draftTheme, draftWp); setDirty(false); };
  const onOK   = () => { commit(); onClose(); };
  const onCancel = () => { onClose(); };   // drafts discarded (re-synced on next open)

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const setThemeDraft = (t) => { setDraftTheme(t); setDirty(true); };
  const setWpDraft    = (id) => { setDraftWp(id);  setDirty(true); };

  return (
    <div className="dialog-back" onMouseDown={() => { playClick(); onCancel(); }}>
      <div className="dispprop-dialog" onMouseDown={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="dispprop-dialog-title">
        <div className="paint-titlebar">
          <OsDisplaySet className="title-ico-img" size={16} />
          <span className="paint-title-txt" id="dispprop-dialog-title">Display Properties</span>
          <div className="paint-winbtns">
            <button className="win-btn win-close" aria-label="Close" onClick={() => { playClick(); onCancel(); }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="dp-tabs">
          {['Appearance', 'Background', 'About'].map(t => (
            <button key={t}
              className={`dp-tab${tab === t ? ' dp-tab-active' : ''}`}
              onClick={() => { playClick(); setTab(t); }}>
              {t}
            </button>
          ))}
        </div>

        <div className="dp-body">
          {/* ── APPEARANCE: theme toggle ── */}
          {tab === 'Appearance' && (
            <div className="dp-appearance">
              <div className="dp-monitor">
                <div className={`dp-screen dp-screen-${draftTheme}`}>
                  <div className="dp-screen-titlebar" />
                  <div className="dp-screen-rows">
                    <span /><span /><span />
                  </div>
                </div>
                <div className="dp-monitor-stand" />
                <div className="dp-monitor-base" />
              </div>

              <div className="dp-fieldset">
                <div className="dp-legend">Color Scheme</div>
                <p className="dp-hint">Choose how SHREY/OS looks across every window.</p>
                <div className="dp-theme-row">
                  <button
                    className={`dp-theme-opt${draftTheme === 'light' ? ' dp-theme-sel' : ''}`}
                    onClick={() => { playClick(); setThemeDraft('light'); }}>
                    <span className="dp-swatch dp-swatch-light" /> Light (Classic)
                  </button>
                  <button
                    className={`dp-theme-opt${draftTheme === 'dark' ? ' dp-theme-sel' : ''}`}
                    onClick={() => { playClick(); setThemeDraft('dark'); }}>
                    <span className="dp-swatch dp-swatch-dark" /> Dark (Midnight)
                  </button>
                </div>

                <div className="dp-toggle-row">
                  <span>Dark Mode</span>
                  <button
                    className={`dp-switch${draftTheme === 'dark' ? ' dp-switch-on' : ''}`}
                    role="switch" aria-checked={draftTheme === 'dark'}
                    onClick={() => { playClick(); setThemeDraft(draftTheme === 'dark' ? 'light' : 'dark'); }}>
                    <span className="dp-switch-knob" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── BACKGROUND: generative backdrop modes ── */}
          {tab === 'Background' && (
            <div className="dp-wallpaper">
              <div className="dp-monitor dp-monitor-lg">
                <div className={`dp-screen dp-screen-preview dp-screen-${draftTheme} dp-bg-${draftWp}`} />
                <div className="dp-monitor-stand" />
                <div className="dp-monitor-base" />
              </div>

              <div className="dp-fieldset">
                <div className="dp-legend">Background</div>
                <p className="dp-hint">One continuous, generative backdrop for the whole site — it darkens as you scroll (Descent). Pick a motion layer:</p>
                <div className="dp-wp-list" role="listbox">
                  {BG_MODES.map(w => (
                    <button key={w.id} role="option" aria-selected={draftWp === w.id}
                      className={`dp-wp-item${draftWp === w.id ? ' dp-wp-sel' : ''}`}
                      onClick={() => { playClick(); setWpDraft(w.id); }}>
                      <span className="dp-wp-swatch"><span className={`dp-bg-chip dp-bg-${w.id}`} /></span>
                      <span className="dp-wp-name">{w.name}<em className="dp-wp-desc">{w.desc}</em></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ABOUT ── */}
          {tab === 'About' && (
            <div className="dp-about">
              <div className="dp-about-logo">SHREY/OS</div>
              <p><b>SHREY/OS Display Driver</b></p>
              <p>Adapter: SHREY-VGA 256-color</p>
              <p>Resolution: responsive · CRT-emulated</p>
              <br />
              <p>Tip: try Dark (Midnight) with the Starfield backdrop.</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="dp-footer">
          <button className="dp-btn" onClick={() => { playClick(); onOK(); }}>OK</button>
          <button className="dp-btn" onClick={() => { playClick(); onCancel(); }}>Cancel</button>
          <button className={`dp-btn${dirty ? '' : ' dp-btn-disabled'}`}
            disabled={!dirty}
            onClick={() => { playClick(); commit(); }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

function ThemePopup({ open, theme, onToggle, onOpenSettings, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="theme-popup">
        <div className="theme-popup-row">
          <span className="theme-popup-label">
            {theme === 'dark' ? <><PxLightbulbOff className="theme-pop-ico" size={24} /><span>Dark Mode</span></> : <><PxLightbulb className="theme-pop-ico" size={24} /><span>Light Mode</span></>}
          </span>
          <button
            className={`dp-switch${theme === 'dark' ? ' dp-switch-on' : ''}`}
            role="switch" aria-checked={theme === 'dark'}
            onClick={() => { playClick(); onToggle(); }}>
            <span className="dp-switch-knob" />
          </button>
        </div>
        <div className="theme-popup-sep" />
        <button className="theme-popup-item" onClick={() => { playClick(); onOpenSettings(); }}>
          <OsDisplaySet className="theme-pop-ico os-ico-slot" size={16} />
          <span>Display Properties...</span>
        </button>
      </div>
    </>
  );
}

function SetupMeter({ stage }) {
  return (
    <div className="setup-meter" title={`Desktop setup: ${stage + 1} of 4`}>
      <span className="setup-label">SETUP</span>
      <div className="setup-segs">
        {[0,1,2,3].map(i => (
          <span key={i} className={`setup-seg${i <= stage ? ' setup-seg-on' : ''}`} />
        ))}
      </div>
      <span className="setup-count">{stage + 1}/4</span>
    </div>
  );
}

const TB_WINS = [
  { id: 'paint',      Ico: OsPaint,      label: 'Paint',            minStage: 1 },
  { id: 'notepad',    Ico: OsTextEditor, label: 'README.TXT',       minStage: 2 },
  { id: 'sysprops',   Ico: OsSettings,   label: 'Properties',       minStage: 3 },
  { id: 'about',      Ico: OsHelp,       label: 'About',            minStage: 0 },
  { id: 'sysmonitor', Ico: OsSysMonitor, label: 'System Monitor',   minStage: 0 },
  { id: 'explorer',   Ico: OsFolder,     label: 'Projects',         minStage: 0 },
  { id: 'journey',    Ico: OsProfiler,   label: 'Training Monitor', minStage: 0 },
  { id: 'aiterminal', Ico: OsTerminal,   label: 'AI.TERMINAL',      minStage: 0 },
];

function Win95Taskbar({ clock, onAction, muted, onToggleMute, wins, onWinAction, stage = 3, showMeter = true,
                        theme, onToggleTheme, onOpenDisplay }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const handleAction = a => { onAction(a); setMenuOpen(false); };

  /* Real-OS behaviour: clicking anywhere outside an open menu closes it
     (capture phase, so it wins even if the click lands on something that
     stops propagation). Esc closes too. The toggle buttons are excluded so
     their own click keeps working as a toggle, not close-then-reopen. */
  useEffect(() => {
    if (!menuOpen && !themeOpen) return;
    const onDown = e => {
      const t = e.target;
      if (menuOpen && !t.closest?.('.start-menu') && !t.closest?.('.start-btn')) setMenuOpen(false);
      if (themeOpen && !t.closest?.('.theme-popup') && !t.closest?.('.theme-btn')) setThemeOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') { setMenuOpen(false); setThemeOpen(false); } };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, themeOpen]);

  return (
    <>
      <StartMenu open={menuOpen} onAction={handleAction} onClose={() => setMenuOpen(false)} />
      <div className="taskbar">
        <button className={`start-btn${menuOpen ? ' start-btn-active' : ''}`}
          onClick={() => { playClick(); setMenuOpen(v => !v); }}>
          <span className="win-logo" aria-hidden="true"><PxAppWindows size={24} /></span><b>Start</b>
        </button>
        <div className="tb-sep" />
        <div className="tb-tasks">
          {TB_WINS.filter(w => wins?.[w.id]?.open && stage >= w.minStage).map(w => (
            <button key={w.id}
              className={`tb-task tb-task-in${!wins[w.id].minimized ? ' tb-active' : ''}`}
              onClick={() => { playClick(); onWinAction(w.id, 'toggle'); }}>
              <w.Ico className="tb-task-ico" size={24} /> {w.label}
            </button>
          ))}
        </div>
        {showMeter && <SetupMeter stage={stage} />}

        {/* Theme button (opens the quick popup) — sits right of the setup meter */}
        <div className="theme-btn-wrap">
          <ThemePopup
            open={themeOpen}
            theme={theme}
            onToggle={onToggleTheme}
            onOpenSettings={() => { setThemeOpen(false); onOpenDisplay(); }}
            onClose={() => setThemeOpen(false)}
          />
          <button className={`theme-btn${themeOpen ? ' theme-btn-active' : ''}`}
            onClick={() => { playClick(); setThemeOpen(v => !v); }}
            aria-label="Change theme"
            title="Theme & display">
            <span className="theme-btn-ico" aria-hidden="true">{theme === 'dark' ? <PxLightbulbOff size={24} /> : <PxLightbulb size={24} />}</span>
          </button>
        </div>

        <div className="tb-tray">
          <TrayNetwork />
          <button className="tray-vol-btn" onClick={() => { playClick(); onToggleMute(); }}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            title={muted ? 'Click to unmute' : 'Click to mute'}>
            {muted ? <PxVolumeMute size={24} /> : <PxVolume size={24} />}
          </button>
          <span className="tray-online"><span className="tray-dot" />ONLINE</span>
          <div className="tb-sep tray-sep" />
          <span className="tray-clock">{clock}</span>
        </div>
      </div>
    </>
  );
}
/* ══════════════════════════════════════════════════════════════════════════
   PERSISTENT SHELL — renders the fixed layer from OS context, then children.
  ══════════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
   SITE BACKGROUND — one continuous, generative backdrop behind every section.
   Base "Descent" gradient (CSS, driven by --scroll-p: warm graphite up top →
   near-black at the end) + a selectable procedural motion layer on a fixed,
   DPR-capped canvas. Replaces per-section wallpapers, so the whole scroll is
   uniform and seamless at any viewport / any length.
  ══════════════════════════════════════════════════════════════════════════ */
const BG_MODES = [
  { id: 'starfield', name: 'Starfield',      desc: 'Amber phosphor warp' },
  { id: 'mystify',   name: 'Mystify',        desc: 'Bouncing ribbons' },
  { id: 'grid',      name: 'Phosphor Grid',  desc: 'Receding horizon' },
  { id: 'none',      name: 'None \u00b7 Descent', desc: 'Gradient only' },
];
const BG_IDS = BG_MODES.map(m => m.id);

function SiteBackground() {
  const os = useOS();
  const reduced = os.reducedMotion;
  const mode = BG_IDS.includes(os.wallpaperId) ? os.wallpaperId : 'starfield';
  const canvasRef = useRef(null);
  const pRef = useRef(0);

  /* global scroll progress → --scroll-p (rAF-throttled) + pRef for the canvas */
  useEffect(() => {
    let raf = 0;
    const write = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = (doc.scrollHeight - window.innerHeight) || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      pRef.current = p;
      doc.style.setProperty('--scroll-p', p.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(write); };
    write();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* procedural motion layer */
  useEffect(() => {
    if (mode === 'none') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const AMBER = '232,144,32', BONE = '224,222,214';
    let w = 0, h = 0;
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let stars = [], mys = null, raf = 0, lastY = window.scrollY, vel = 0;
    if (mode === 'starfield')
      for (let i = 0; i < 230; i++) stars.push({ x: Math.random()*2-1, y: Math.random()*2-1, z: Math.random() });
    if (mode === 'mystify') {
      const mk = hue => ({
        pts: Array.from({ length: 5 }, () => ({
          x: Math.random()*w, y: Math.random()*h,
          vx: (Math.random()*2-1)*1.15, vy: (Math.random()*2-1)*1.15,
        })),
        trail: [], hue,
      });
      mys = [mk(AMBER), mk(BONE)];
    }

    const draw = () => {
      const p = pRef.current;
      ctx.clearRect(0, 0, w, h);

      if (mode === 'starfield') {
        const cx = w/2, cy = h*0.42;
        const y = window.scrollY; vel += ((y - lastY) - vel) * 0.18; lastY = y;
        const speed = 0.0015 + Math.min(0.02, Math.abs(vel) * 0.0003);
        for (const s of stars) {
          s.z -= speed;
          if (s.z <= 0.02) { s.x = Math.random()*2-1; s.y = Math.random()*2-1; s.z = 1; }
          const px = cx + (s.x / s.z) * (w*0.55), py = cy + (s.y / s.z) * (h*0.55);
          if (px < -4 || px > w+4 || py < -4 || py > h+4) continue;
          const sz = Math.max(0.5, (1 - s.z) * 2.6), a = (1 - s.z) * 0.8 * (1 - p*0.28);
          ctx.fillStyle = `rgba(${s.z < 0.55 ? AMBER : BONE},${a})`;
          ctx.beginPath(); ctx.arc(px, py, sz, 0, 6.283); ctx.fill();
        }
      } else if (mode === 'mystify') {
        for (const poly of mys) {
          for (const pt of poly.pts) {
            pt.x += pt.vx; pt.y += pt.vy;
            if (pt.x < 0 || pt.x > w) { pt.vx *= -1; pt.x = Math.max(0, Math.min(w, pt.x)); }
            if (pt.y < 0 || pt.y > h) { pt.vy *= -1; pt.y = Math.max(0, Math.min(h, pt.y)); }
          }
          poly.trail.unshift(poly.pts.map(q => ({ x: q.x, y: q.y })));
          if (poly.trail.length > 16) poly.trail.pop();
          poly.trail.forEach((snap, i) => {
            const a = (1 - i / poly.trail.length) * 0.62 * (1 - p*0.28);
            ctx.strokeStyle = `rgba(${poly.hue},${a})`; ctx.lineWidth = 1.8;
            ctx.shadowColor = `rgba(${poly.hue},0.5)`; ctx.shadowBlur = 6;
            ctx.beginPath();
            snap.forEach((pt, j) => (j ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
            ctx.closePath(); ctx.stroke();
          });
        }
        ctx.shadowBlur = 0;
      } else if (mode === 'grid') {
        const horizon = h * (0.28 + p*0.14), vpx = w/2;
        for (let i = -12; i <= 12; i++) {
          const x = vpx + i * (w*0.13);
          ctx.strokeStyle = `rgba(${AMBER},${0.26 * (1 - p*0.25)})`; ctx.lineWidth = 1;
          ctx.shadowColor = `rgba(${AMBER},0.4)`; ctx.shadowBlur = 4;
          ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(vpx, horizon); ctx.stroke();
        }
        for (let i = 1; i <= 18; i++) {
          const f = i/18, yy = horizon + Math.pow(f, 2.3) * (h - horizon);
          const a = (1 - f) * 0.36 * (1 - p*0.25);
          ctx.strokeStyle = `rgba(${AMBER},${a})`;
          ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    };

    if (reduced) { draw(); return () => window.removeEventListener('resize', resize); }
    const loop = () => { raf = requestAnimationFrame(loop); draw(); };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [mode, reduced]);

  return (
    <div className="site-bg" aria-hidden="true">
      {/* key={mode} remounts a clean canvas whenever Display Properties applies
          a new backdrop, so the switch is instant and stateless */}
      {mode !== 'none' && <canvas key={mode} ref={canvasRef} className="site-bg-canvas" />}
      <div className="site-bg-veil" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHUT DOWN — the boot animation in reverse (see CRTShutdownAnimation in
   CRTBootAnimation.jsx: same palette, grain, easings and text metrics).
   Portalled to <body> so no ancestor transform/filter can hijack the
   fixed positioning or clip it to half a screen.
═══════════════════════════════════════════════════════════════════════════ */
function ShutdownSequence({ open, onRestart }) {
  if (!open) return null;
  return createPortal(
    <CRTShutdownAnimation onRestart={onRestart} playFx={playWhoosh} />,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ScrollToTop — circular progress ring + arrow, fixed bottom-right above the
   taskbar. Appears once the visitor is ~one viewport in, reads the same
   --scroll-p variable SiteBackground already sets, so no extra listeners.
   Palette matches the OS: amber accent, phosphor at completion, graphite ring.
═══════════════════════════════════════════════════════════════════════════ */
function ScrollToTop() {
  /* React re-renders were introducing perceived scroll lag (setState → diff
     → commit takes 2–3 frames). We write both the SVG offset AND the class
     changes IMPERATIVELY via refs, so every rAF tick pushes the ring exactly
     one frame after the scroll event fires. */
  const btnRef  = useRef(null);
  const arcRef  = useRef(null);
  const stateRef = useRef({ visible: false, full: false });

  useEffect(() => {
    let raf = null;
    const R = 22;
    const C = 2 * Math.PI * R;
    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      const btn = btnRef.current;
      const arc = arcRef.current;
      if (arc) arc.style.strokeDashoffset = String(C - C * p);
      if (btn) {
        const nextVisible = doc.scrollTop > window.innerHeight * 0.4;
        const nextFull    = p > 0.99;
        if (nextVisible !== stateRef.current.visible) {
          btn.classList.toggle('s2t-visible', nextVisible);
          stateRef.current.visible = nextVisible;
        }
        if (nextFull !== stateRef.current.full) {
          btn.classList.toggle('s2t-full', nextFull);
          stateRef.current.full = nextFull;
        }
      }
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const onClick = () => {
    playClick();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  // SVG ring metrics — r=22 → circumference ~138.23
  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <button
      ref={btnRef}
      type="button"
      className="s2t"
      onClick={onClick}
      aria-label="Scroll to top"
      title="Scroll to top">
      <svg className="s2t-svg" viewBox="0 0 54 54" aria-hidden="true">
        {/* graphite track */}
        <circle className="s2t-track" cx="27" cy="27" r={R} />
        {/* progress arc — rotated -90° so 0% starts at 12 o'clock */}
        <circle
          ref={arcRef}
          className="s2t-arc"
          cx="27" cy="27" r={R}
          strokeDasharray={C}
          strokeDashoffset={C}
          transform="rotate(-90 27 27)"
        />
      </svg>
      <span className="s2t-arrow" aria-hidden="true">
        <svg viewBox="0 0 23 23" width="24" height="24">
          <path d="M12 4 L12 20 M6 10 L12 4 L18 10"
            fill="none" stroke="currentColor" strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

export default function FixedComponents({ children }) {
  const os = useOS();

  // Mobile keeps its own menu inside the hero, but the shared dialogs are
  //  viewport-agnostic — without them My Computer (About), the dial-up
  //  animation, and Display Properties were dead buttons on phones.
  if (os.isMobile) return (
    <>
      <SiteBackground />
      <AboutDialog open={os.aboutOpen} onClose={() => os.setAboutOpen(false)} />
      {os.dialupOpen && <DialupOverlay phase={os.dialupPhase} />}
      <RecycleBinDialog open={os.recycleOpen} onClose={() => os.setRecycleOpen(false)} />
      <ShutdownSequence open={os.shutdownOpen} onRestart={() => window.location.reload()} />
      <DisplayProperties
        open={os.displayOpen}
        onClose={() => os.setDisplayOpen(false)}
        theme={os.theme}
        wallpaperId={os.wallpaperId}
        onApply={os.applyDisplay}
      />
      <ScrollToTop />
      {children}
    </>
  );

  return (
    <>
      <SiteBackground />
      <DotRingCursor />

      <ContextMenu pos={os.ctxMenu} onAction={os.handleAction} onClose={() => os.setCtxMenu(null)} />
      <AboutDialog open={os.aboutOpen} onClose={() => os.setAboutOpen(false)} />
      {os.dialupOpen && <DialupOverlay phase={os.dialupPhase} />}
      <RecycleBinDialog open={os.recycleOpen} onClose={() => os.setRecycleOpen(false)} />
      <ShutdownSequence open={os.shutdownOpen} onRestart={() => window.location.reload()} />
      <BSODScreen open={os.bsodOpen} onDismiss={() => os.setBsodOpen(false)} />
      <Screensaver active={os.ssActive} onDismiss={() => os.setSsActive(false)} />
      <ContactWindow
        open={os.contactOpen}
        onClose={() => os.setContactOpen(false)}
        cvHref={cvHref}
        onSound={playClick}
        onSent={playWhoosh}
      />
      {/* THE project window — visibility owned by wins.explorer; ProjectsSection
          boots disks into it via the shreyos-open-project event and its close
          button auto-ejects Drive A via shreyos-eject-disk. */}
      <ProjectsWindow />
      <DisplayProperties
        open={os.displayOpen}
        onClose={() => os.setDisplayOpen(false)}
        theme={os.theme}
        wallpaperId={os.wallpaperId}
        onApply={os.applyDisplay}
      />

      {/* desktop icons — persistent across every section */}
      <div className="fixed-layer">
        <div className="icons-col">
          {DESKTOP_ICONS.map(icon => (
            <DesktopIcon key={icon.id} icon={icon}
              onDblClick={ic => os.handleAction(ic.dblAction || '')} />
          ))}
        </div>
      </div>

      <Win95Taskbar
        clock={os.clock}
        onAction={os.handleAction}
        muted={os.muted}
        onToggleMute={os.toggleMute}
        wins={os.wins}
        onWinAction={os.wAction}
        stage={os.stage}
        theme={os.theme}
        onToggleTheme={os.toggleTheme}
        onOpenDisplay={() => os.setDisplayOpen(true)}
      />

      <ScrollToTop />
      {children}
    </>
  );
}