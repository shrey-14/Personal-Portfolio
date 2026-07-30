/* ══════════════════════════════════════════════════════════════════════════
   HeroSection.jsx — SHREY/OS section 01.
   Just the hero surface: the scroll-driven wordmark morph, the three windows
   (Paint+photo · Notepad · System Properties) and the two folder buttons, plus
   the choreography that drives them. All OS chrome (cursor, icons, taskbar,
   overlays) now lives in FixedComponents and is shared via OSContext.
   ═════════════════════════════════════════════════════════════════════════ */
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import heroFigureSrc from './assets/hero_figure.png';
import heroFigureWebp from './assets/hero_figure.webp';
import ContactWindow from './ContactWindow';
import {
  useOS, playClick, playWindowOpen, playWhoosh, WIN98, DESKTOP_ICONS, cvHref,
} from './OSContext';
import {
  PxLightbulb, PxLightbulbOff, PxVolume, PxVolumeMute,
} from './PixelIcons.jsx';
import {
  OsFolder, OsFolderOpen, OsComputer, OsPaint, OsTextEditor, OsDisplaySet,
} from './OsIcons.jsx';

let topZ = 20;
const PALETTE_ROW1 = ['#000','#808080','#800000','#808000','#008000','#008080','#000080','#800080','#804000','#408080','#004080','#400080','#800040','#804040'];
const PALETTE_ROW2 = ['#fff','#c0c0c0','#f00','#ff0','#0f0','#0ff','#00f','#f0f','#ff8040','#40ffff','#4080ff','#8040ff','#ff4080','#ff8080'];
const DEVICE_MANAGER = [
  { cat: 'Skills · preview', items: [
    { n: 'Python',   p: 95 },
    { n: 'PyTorch',  p: 86 },
    { n: 'FastAPI',  p: 85 },
    { n: 'SQL',      p: 88 },
  ]},
];
const TERMINAL_LINES = [
  { type: 'command', text: 'whoami' },
  { type: 'output',  text: 'Shrey Patel' },
  { type: 'output',  text: 'MSc Artificial Intelligence · Brunel University London' },
  { type: 'blank' },
  { type: 'command', text: 'cat about.txt' },
  { type: 'output',  text: "I'm the one who optimised 800+ SQL pipelines at" },
  { type: 'output',  text: 'his first internship, then won the company hackathon' },
  { type: 'output',  text: 'with YOLOv8 + LLaMA + XGBoost + Prophet — all in one weekend.' },
  { type: 'blank' },
  { type: 'output',  text: 'Now building AI Radar: a pipeline that scrapes,' },
  { type: 'output',  text: 'summarises, and delivers the AI news that actually' },
  { type: 'output',  text: 'matters. Every morning. Automatically.' },
  { type: 'blank' },
  { type: 'command', text: 'cat interests.log' },
  { type: 'output',  text: '⌐ Reading: Explainable ML papers' },
  { type: 'output',  text: '⌐ Building: RAG evaluation frameworks' },
  { type: 'output',  text: '⌐ Consuming: LangChain docs (unhealthy amount)' },
  { type: 'output',  text: '⌐ Exploring: Open-source contributions' },
  { type: 'blank' },
  { type: 'command', text: 'ls projects/' },
  { type: 'output',  text: 'drwxr-xr-x  AI-Radar/           [LIVE]' },
  { type: 'output',  text: 'drwxr-xr-x  Contract-Tracker/   [IN DEV]' },
  { type: 'output',  text: 'drwxr-xr-x  Road-Damage/        [87% mAP]' },
  { type: 'output',  text: 'drwxr-xr-x  Kitchen-Opt/        [1ST PLACE]' },
  { type: 'blank' },
  { type: 'command', text: 'status --check' },
  { type: 'output',  text: '> SEEKING: AI/ML placement, 2026-2027' },
  { type: 'output',  text: '> LOCATION: London, UK' },
  { type: 'output',  text: '> STACK: Python · PyTorch · LangChain · FastAPI' },
  { type: 'blank' },
  { type: 'command', text: 'echo $PHILOSOPHY' },
  { type: 'output',  text: '"I don\'t mass-apply. I find teams building' },
  { type: 'output',  text: ' something I\'d think about on a Sunday night,' },
  { type: 'output',  text: ' and I show them what I\'ve already built."' },
];
const S = {
  hint:     [0.00, 0.06],   // scroll hint fades out
  name:     [0.02, 0.44],   // name: continuous shrink + un-stack + rise
  subtitle: [0.30, 0.46],   // subtitle grows out of the name baseline
  paint:    [0.02, 0.46],   // Paint(figure) scales down; chrome fades in
  fold0:    [0.34, 0.48],   // folders fade in beside Paint

  note:     [0.50, 0.66],   // Notepad slides in from right
  fold1:    [0.50, 0.66],   // folders → below Notepad
  fold2:    [0.68, 0.84],   // folders → below Paint (final)
  sys:      [0.72, 0.92],   // System Properties rises in
};

/* Discrete stage thresholds (taskbar buttons, terminal start, sounds). */
const STAGE_UP   = [0.30, 0.50, 0.68];
const STAGE_HYST = 0.03;

const TARGET_NAME_H = 40;
const clamp01 = t => Math.max(0, Math.min(1, t));
const seg     = (p, [a, b]) => clamp01((p - a) / (b - a));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));  // snappier, modern settle
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);  // smooth both ends
const lerp    = (a, b, t) => a + (b - a) * t;// ── Folder button ─────────────────────────────────────────────────────────────
function FolderButton({ label, href, download, onAction }) {
  const [open, setOpen] = useState(false);
  const Tag = (href && !onAction) ? 'a' : 'button';
  return (
    <Tag href={onAction ? undefined : href} download={onAction ? undefined : download}
      className="folder-btn"
      data-action={onAction ? "projects" : undefined}
      onClick={() => { playClick(); onAction?.(); }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}>
      {open
        ? <OsFolderOpen className="folder-img folder-img-open" size={48} />
        : <OsFolder className="folder-img" size={48} />}
      <span className="folder-label">{label}</span>
    </Tag>
  );
}

const TOOLS = [
  { name:'Free Select',  svg:<svg viewBox="0 0 16 16"><path d="M8,2 L10,5 L14,6 L11,9 L12,13 L8,11 L4,13 L5,9 L2,6 L6,5 Z" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,1.5"/></svg> },
  { name:'Rect Select',  svg:<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,1.5"/></svg> },
  { name:'Eraser',       svg:<svg viewBox="0 0 16 16"><rect x="2" y="5" width="12" height="7" fill="#FFB0A0" stroke="#808080" strokeWidth="0.8"/><rect x="2" y="10" width="12" height="2" fill="#D07060"/><rect x="2" y="5" width="3" height="7" fill="#E8E8E8"/></svg> },
  { name:'Fill Bucket',  svg:<svg viewBox="0 0 16 16"><path d="M2,13 L7,3 L9,4 L10,8 L8,11 Z" fill="#333"/><ellipse cx="12.5" cy="12.5" rx="2.5" ry="2.5" fill="#00C"/></svg> },
  { name:'Color Pick',   svg:<svg viewBox="0 0 16 16"><path d="M9,1 L14,6 L5,14 L2,14 L2,11 Z" fill="#40C0FF" stroke="#000" strokeWidth="0.5"/><rect x="1" y="12" width="3" height="3" fill="#40C0FF"/></svg> },
  { name:'Magnifier',    svg:<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="rgba(180,210,255,0.5)" stroke="#000" strokeWidth="1.2"/><line x1="10" y1="10" x2="15" y2="15" stroke="#000" strokeWidth="1.8"/></svg> },
  { name:'Pencil',       svg:<svg viewBox="0 0 16 16"><polygon points="2,14 3,15 13,5 12,4" fill="#F0C840" stroke="#807020" strokeWidth="0.5"/><polygon points="12,4 13,5 15,3 14,2" fill="#808080"/><polygon points="1,15 3,15 2,14" fill="#F8F8F0"/></svg> },
  { name:'Brush',        svg:<svg viewBox="0 0 16 16"><polygon points="3,13 4,14 13,5 12,4" fill="#8B4513" stroke="#6B3010" strokeWidth="0.5"/><circle cx="3.5" cy="13.5" r="2.5" fill="#4080FF"/></svg> },
  { name:'Airbrush',     svg:<svg viewBox="0 0 16 16"><rect x="5" y="3" width="6" height="8" rx="1" fill="#6090C0" stroke="#404060" strokeWidth="0.8"/><rect x="9" y="6" width="5" height="2" fill="#4060A0"/><circle cx="3" cy="12" r="1.2" fill="#222"/><circle cx="2" cy="9" r="0.9" fill="#333"/><circle cx="4" cy="10" r="0.7" fill="#444"/></svg> },
  { name:'Text A',       svg:<svg viewBox="0 0 16 16"><text x="2" y="13" fontSize="13" fontWeight="bold" fontFamily="Times New Roman,serif" fill="#000">A</text></svg> },
  { name:'Line',         svg:<svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2" stroke="#000" strokeWidth="1.5"/></svg> },
  { name:'Curve',        svg:<svg viewBox="0 0 16 16"><path d="M2,14 Q3,2 8,8 Q13,14 14,2" fill="none" stroke="#000" strokeWidth="1.5"/></svg> },
  { name:'Rectangle',    svg:<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" fill="none" stroke="#000" strokeWidth="1.5"/></svg> },
  { name:'Polygon',      svg:<svg viewBox="0 0 16 16"><polygon points="8,2 14,8 11,14 5,14 2,8" fill="none" stroke="#000" strokeWidth="1.5"/></svg> },
  { name:'Ellipse',      svg:<svg viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="6" ry="5" fill="none" stroke="#000" strokeWidth="1.5"/></svg> },
  { name:'Rounded Rect', svg:<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="3" fill="none" stroke="#000" strokeWidth="1.5"/></svg> },
];

// ── Shared window chrome (titlebar + buttons) — used by desktop & mobile ─────
function WindowChrome({ title, titleIcon, onClose, onMinimize, onTitlebarPointerDown, active = true }) {
  return (
    <div className={`paint-titlebar draggable-titlebar${active ? '' : ' tb-inactive'}`}
      onPointerDown={onTitlebarPointerDown}>
      {titleIcon /* pixel icon element — see PixelIcons.jsx */}
      <span className="paint-title-txt">{title}</span>
      {active && <span className="tb-live-dot" aria-hidden="true" />}
      <div className="paint-winbtns">
        {onMinimize && (
          <button className="win-btn" aria-label={`Minimize ${title}`}
            onClick={e => { e.stopPropagation(); playClick(); onMinimize(); }}>_</button>
        )}
        <button className="win-btn" aria-hidden="true" tabIndex={-1}
          onClick={e => e.stopPropagation()}>□</button>
        {onClose && (
          <button className="win-btn win-close" aria-label={`Close ${title}`}
            onClick={e => { e.stopPropagation(); playClick(); onClose(); }}>✕</button>
        )}
      </div>
    </div>
  );
}

// ── Win95Window — draggable (pointer events, viewport-clamped) ───────────────
function Win95Window({ title, titleIcon, x, y, z = 10,
                       open = true, minimized = false, children,
                       onClose, onMinimize, style = {}, outerRef,
                       active = true, winId, onFocus, className = '' }) {
  const ref = useRef(null);
  const setRefs = useCallback(node => {
    ref.current = node;
    if (outerRef) outerRef.current = node;
  }, [outerRef]);

  /* Reposition when the responsive layout recomputes (resize/rotation).
     Deliberately overrides a stale user drag on resize — a drag position from
     a previous viewport is worse than a clean reset. */
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.left   = x + 'px';
    ref.current.style.top    = y + 'px';
    ref.current.style.zIndex = z;
  }, [x, y, z]);

  const bringToFront = useCallback(e => {
    if (winId) onFocus?.(winId);
    if (!ref.current || e.target.closest?.('.win-btn')) return;
    topZ++;
    ref.current.style.zIndex = topZ;
  }, [winId, onFocus]);

  /* Drag state. Deliberately drives left/top rather than transform: the scroll
     choreography in applyProgress owns this element's `transform` and rewrites
     it every frame, so a transform-based drag would be wiped on the next
     scroll. left/top is a separate channel, so a dragged window stays put. */
  const drag = useRef({ pointerId: null, raf: 0, nx: 0, ny: 0 });

  useEffect(() => () => { if (drag.current.raf) cancelAnimationFrame(drag.current.raf); }, []);

  const onTitlebarPointerDown = useCallback(e => {
    if (e.target.closest?.('.win-btn')) return;
    if (winId) onFocus?.(winId);
    if (!ref.current) return;
    const d = drag.current;
    // Multi-touch protection: once a pointer owns the drag, ignore later ones.
    // Without this, a second finger snaps the window to its position.
    if (d.pointerId !== null) return;

    const el  = ref.current;
    const bar = e.currentTarget;          // captured now — currentTarget is null once async
    topZ++;
    el.style.zIndex = topZ;
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    const w  = rect.width;

    d.pointerId = e.pointerId;
    try { bar.setPointerCapture(e.pointerId); } catch { /* capture unsupported */ }

    const flush = () => {
      d.raf = 0;
      el.style.left = d.nx + 'px';
      el.style.top  = d.ny + 'px';
    };
    const onMove = ev => {
      if (ev.pointerId !== d.pointerId) return;
      // Clamp so the titlebar can never leave the viewport — windows can't be lost.
      d.nx = Math.max(-w + 60, Math.min(window.innerWidth - 60, ev.clientX - ox));
      // 54 = taskbar (32) + titlebar (22): the bar can never swallow a window.
      d.ny = Math.max(0, Math.min(window.innerHeight - 54, ev.clientY - oy));
      // Coalesce to one write per frame: pointermove outpaces the display on
      // 120Hz+ input, and every left/top write costs a layout pass.
      if (!d.raf) d.raf = requestAnimationFrame(flush);
    };
    const onUp = ev => {
      if (ev.pointerId !== d.pointerId) return;
      if (d.raf) { cancelAnimationFrame(d.raf); flush(); }
      d.pointerId = null;
      try { bar.releasePointerCapture(ev.pointerId); } catch { /* already released */ }
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }, [winId, onFocus]);

  if (!open) return null;

  return (
    <div
      ref={setRefs}
      className={`win95-window${active ? ' win-active' : ' win-inactive'}${className ? ' ' + className : ''}`}
      style={{ display: minimized ? 'none' : undefined, ...style }}
      onMouseDown={bringToFront}
    >
      <WindowChrome
        title={title} titleIcon={titleIcon}
        onClose={onClose} onMinimize={onMinimize}
        onTitlebarPointerDown={onTitlebarPointerDown}
        active={active}
      />
      {children}
    </div>
  );
}

function StaticWindow({ title, titleIcon, children, className = '' }) {
  return (
    <div className={`win95-window win95-static ${className}`}>
      <WindowChrome title={title} titleIcon={titleIcon} />
      {children}
    </div>
  );
}


// ── Cinematic 3D portrait ─────────────────────────────────────────────────────
/* The photo in the Paint window becomes a physical object:
   · TILT — the portrait leans toward the cursor in real perspective (rotateX/Y
     up to ~7°, slight lift), eased through an rAF loop, settling back on leave.
   · GLARE — a specular sweep tracks the cursor across the "glass".
   · LIVING PORTRAIT — on hover, a subtle identity-consistent video (breathing,
     blink, hint of a smile; generated via Seedance from the same photo) fades
     in over the still and plays; it pauses + fades out on leave. The still is
     the <video> poster AND the permanent fallback: if /portrait/portrait_live.mp4
     doesn't exist (or fails), the video layer never shows and the site is
     complete without it.
   Touch devices: no tilt; a tap toggles the living portrait instead.
   Reduced motion: still photo only, no tilt, no video. */
/* SpotlightFigure — the hero figure as TWO stacked images (base + reveal) whose
   colour treatment SWAPS across the dock, exactly like the reference mockup.

   The spotlight is a radial mask on the reveal layer only: a soft circle at the
   cursor shows the reveal image; everywhere else the base image shows through.
   Both layers are clipped to the PNG silhouette automatically (transparent PNG),
   so the background is never touched.

   Colour meaning swaps by dock progress `dp` (0 = hero pose, 1 = docked in the
   Paint frame), read from the --fig-dock var the choreography writes on the
   Paint window:
     • HERO   (dp<0.5): base = GRAYSCALE, reveal = COLOUR  → cursor reveals RGB.
     • DOCKED (dp≥0.5): base = COLOUR,    reveal = GRAYSCALE → cursor reveals gray.
   The base filter cross-fades continuously with dp (grayscale 1→0), and the
   reveal image's filter + circle radius flip at the midpoint so the on-hover
   reveal inverts. No 3D tilt anywhere — the figure is flat and lets the
   spotlight do the work. */
function SpotlightFigure() {
  const frameRef  = useRef(null);
  const baseImgRef   = useRef(null);
  const revealRef    = useRef(null);
  const revealImgRef = useRef(null);
  const reduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const fine = useMemo(
    () => window.matchMedia('(pointer: fine)').matches, []);

  useEffect(() => {
    if (reduced || !fine) return;
    const frame = frameRef.current;
    if (!frame) return;

    // Find the Paint window whose --fig-dock the choreography drives, so we can
    // read dock progress each frame and swap the colour treatment accordingly.
    const dockHost = frame.closest('.win95-window') || document.documentElement;
    const readDock = () => {
      const v = getComputedStyle(dockHost).getPropertyValue('--fig-dock').trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    };

    let mx = -9999, my = -9999, inside = false;
    let raf = null, lastDp = -1, lastSwap = -1;

    const setMask = () => {
      const r = frame.getBoundingClientRect();
      const lx = mx - r.left, ly = my - r.top;
      if (revealRef.current) {
        revealRef.current.style.setProperty('--mx', lx + 'px');
        revealRef.current.style.setProperty('--my', ly + 'px');
      }
    };

    let onScreenRead = () => true; // rebound below once the gate exists
    const loop = () => {
      raf = null;
      if (!onScreenRead()) return;          // sleep — IO wakes us on re-entry
      const dp = readDock();

      // Base layer: grayscale continuously fades out as it docks.
      if (Math.abs(dp - lastDp) > 0.002 && baseImgRef.current) {
        const g  = lerp(1,    0,    dp);
        const ct = lerp(1.12, 1.03, dp);
        const br = lerp(0.86, 1,    dp);
        baseImgRef.current.style.filter =
          `grayscale(${g.toFixed(3)}) contrast(${ct.toFixed(3)}) brightness(${br.toFixed(3)})`;
        lastDp = dp;
      }

      // Reveal layer + spotlight radius flip at the midpoint.
      const swap = dp < 0.5 ? 0 : 1;
      if (swap !== lastSwap && revealImgRef.current && revealRef.current) {
        if (swap === 0) {   // hero: reveal shows full RGB colour
          revealImgRef.current.style.filter = 'grayscale(0) contrast(1.02) brightness(1)';
          revealRef.current.style.setProperty('--fig-r', '120px');
        } else {            // docked: reveal shows grayscale
          revealImgRef.current.style.filter = 'grayscale(1) contrast(1.05) brightness(0.95)';
          revealRef.current.style.setProperty('--fig-r', '90px');
        }
        lastSwap = swap;
      }

      // Fade the reveal circle in/out at the pointer.
      if (revealRef.current) revealRef.current.style.opacity = inside ? '1' : '0';
      setMask();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const onEnter = () => { inside = true;  };
    const onLeave = () => { inside = false; };

    /* Off-screen gate: this loop does two forced style reads per frame
       (readDock + rect), so it fully sleeps while the hero is scrolled away
       and wakes from the IntersectionObserver. */
    let onScreen = true;
    onScreenRead = () => onScreen;
    const io = new IntersectionObserver(([en]) => {
      const was = onScreen;
      onScreen = en.isIntersecting;
      if (onScreen && !was && raf == null) raf = requestAnimationFrame(loop);
    });
    io.observe(frame);

    // Track pointer globally (mask is positioned in the figure's own space) so
    // it works even while the figure is transformed by the scroll choreography.
    document.addEventListener('mousemove', onMove);
    frame.addEventListener('mouseenter', onEnter);
    frame.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      io.disconnect();
      document.removeEventListener('mousemove', onMove);
      frame.removeEventListener('mouseenter', onEnter);
      frame.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, fine]);

  return (
    <div className="spot-figure" ref={frameRef}>
      {/* Base layer — grayscale at rest, cross-fades to colour as it docks. */}
      <div className="figlayer fig-base">
        <picture>
          <source srcSet={heroFigureWebp} type="image/webp" />
          <img ref={baseImgRef} src={heroFigureSrc} alt="Shrey Patel" className="paint-photo" />
        </picture>
      </div>
      {/* Reveal layer — masked to a soft circle at the cursor; colour/gray
          meaning is set from JS and inverts across the dock. */}
      <div className="figlayer fig-reveal" ref={revealRef} aria-hidden="true">
        <picture>
          <source srcSet={heroFigureWebp} type="image/webp" />
          <img ref={revealImgRef} src={heroFigureSrc} alt="" className="paint-photo" />
        </picture>
      </div>
    </div>
  );
}

function PaintContent({ fx = true }) {
  return (
    <>
      <div className="paint-menu">
        {['File','Edit','View','Image','Options','Help'].map(m => (
          <button key={m} className="paint-menuitem" aria-hidden="true" tabIndex={-1}>{m}</button>
        ))}
      </div>
      <div className="paint-body">
        <div className="paint-toolbar">
          <div className="paint-tools-grid">
            {TOOLS.map((t, i) => (
              <button key={i} className={`ptool${i === 6 ? ' ptool-active' : ''}`}
                title={t.name} aria-hidden="true" tabIndex={-1}>{t.svg}</button>
            ))}
          </div>
          <div className="paint-linewidth"><div className="lw-sample" /></div>
        </div>
        <div className="paint-canvas-col">
          <div className="paint-canvas-row">
            {/* Grayscale↔RGB spotlight figure: two stacked images with a
                cursor-following radial reveal. Colour meaning inverts across
                the dock (hero: reveals RGB; docked: reveals grayscale). No 3D
                tilt — the spotlight does the work. */}
            <div className="paint-canvas paint-canvas-photo">
              <SpotlightFigure />
              <div className="pcam-label">
                <div className="pcam-dot" />
                <span className="pcam-txt">CAM 01 · ACTIVE</span>
              </div>
            </div>
            <div className="paint-vscroll">
              <button className="sv-btn" aria-hidden="true" tabIndex={-1}>▲</button>
              <div className="sv-track"><div className="sv-thumb" /></div>
              <button className="sv-btn" aria-hidden="true" tabIndex={-1}>▼</button>
            </div>
          </div>
          <div className="paint-hscroll">
            <button className="sv-btn" aria-hidden="true" tabIndex={-1}>◄</button>
            <div className="sh-track"><div className="sh-thumb" /></div>
            <button className="sv-btn" aria-hidden="true" tabIndex={-1}>►</button>
          </div>
        </div>
      </div>
      <div className="paint-palette">
        <div className="palette-indicator">
          <div className="pal-bg" /><div className="pal-fg" />
        </div>
        <div className="palette-swatches">
          <div className="pal-row">{PALETTE_ROW1.map((c,i) => <div key={i} className="swatch" style={{background:c}}/>)}</div>
          <div className="pal-row">{PALETTE_ROW2.map((c,i) => <div key={i} className="swatch" style={{background:c}}/>)}</div>
        </div>
      </div>
      <div className="paint-statusbar">For Help, click Help Topics on the Help Menu.</div>
    </>
  );
}

function TerminalNotepad({ onCursorUpdate, active = true, instant = false }) {
  const [visibleLines, setVisibleLines] = useState(() => instant ? TERMINAL_LINES.map(l => ({ ...l })) : []);
  const [currentText,  setCurrentText]  = useState('');
  const lineIdxR  = useRef(instant ? TERMINAL_LINES.length : 0);
  const charIdxR  = useRef(0);
  const timerR    = useRef(null);
  const contentR  = useRef(null);
  const doneR     = useRef(instant);
  const startedR  = useRef(instant);

  useEffect(() => {
    if (doneR.current) { onCursorUpdate?.({ ln: visibleLines.length, col: 3 }); return; }
    onCursorUpdate?.({ ln: visibleLines.length + 1, col: currentText.length + 1 });
  }, [visibleLines, currentText, onCursorUpdate]);

  useEffect(() => {
    if (!active || startedR.current) return;
    startedR.current = true;

    const type = () => {
      if (document.hidden) { timerR.current = setTimeout(type, 400); return; }
      const line = TERMINAL_LINES[lineIdxR.current];
      if (!line) { doneR.current = true; setCurrentText(''); return; }

      if (line.type === 'blank') {
        setVisibleLines(p => [...p, { type:'blank', text:'' }]);
        lineIdxR.current++; charIdxR.current = 0; setCurrentText('');
        timerR.current = setTimeout(type, 200);
        return;
      }

      if (charIdxR.current < line.text.length) {
        setCurrentText(line.text.slice(0, charIdxR.current + 1));
        charIdxR.current++;
        timerR.current = setTimeout(type, line.type === 'command' ? 80 : 25);
      } else {
        setVisibleLines(p => [...p, { ...line }]);
        setCurrentText(''); lineIdxR.current++; charIdxR.current = 0;
        timerR.current = setTimeout(type, line.type === 'command' ? 300 : 60);
      }
    };
    timerR.current = setTimeout(type, 500);
    return () => clearTimeout(timerR.current);
  }, [active]);

  useEffect(() => {
    if (contentR.current) contentR.current.scrollTop = contentR.current.scrollHeight;
  }, [visibleLines, currentText]);

  const currentLine = TERMINAL_LINES[lineIdxR.current];

  return (
    <div className="notepad-content" ref={contentR}>
      {visibleLines.map((line, i) => (
        <div key={i} style={{ minHeight: line.type === 'blank' ? '1.1em' : undefined }}>
          {line.type === 'command'
            ? <><span className="term-prompt">&gt; </span>{line.text}</>
            : line.text}
        </div>
      ))}
      {!doneR.current && startedR.current && currentLine && (
        <div>
          {currentLine.type === 'command' && <span className="term-prompt">&gt; </span>}
          {currentText}<span className="term-cursor">█</span>
        </div>
      )}
      {doneR.current && <div><span className="term-prompt">&gt; </span><span className="term-cursor">█</span></div>}
    </div>
  );
}

function NotepadContent({ active, instant }) {
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  return (
    <>
      <div className="paint-menu">
        {['File','Edit','Search','Help'].map(m => (
          <button key={m} className="paint-menuitem" aria-hidden="true" tabIndex={-1}>{m}</button>
        ))}
      </div>
      <div className="notepad-headline">
        MSc AI Student · Building AI Radar · Ex-Petpooja (800+ pipelines)
      </div>
      <TerminalNotepad onCursorUpdate={setCursor} active={active} instant={instant} />
      <div className="notepad-status">Ln {cursor.ln}, Col {cursor.col}</div>
    </>
  );
}

function PerformanceGraph() {
  const canvasRef = useRef(null);
  const dataR = useRef(Array.from({ length: 60 }, () => Math.random() * 40 + 20));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* Theme-aware palette read from the live document theme, so the graph
       stops being the only canvas on the site that ignores dark mode. */
    const palette = () => (
      document.documentElement.getAttribute('data-theme') === 'dark'
        ? { bg: '#14161b', grid: '#2b2f36', line: '#ffb454', fill: 'rgba(232,144,32,0.10)' }
        : { bg: '#ffffff', grid: '#c8c8c8', line: '#000080', fill: 'rgba(0,0,128,0.08)' }
    );

    const draw = () => {
      const c = palette();
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = Math.round((h * i) / 4) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1.5;
      dataR.current.forEach((v, i) => {
        const x = (i / 59) * w;
        const y = h - (v / 100) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = c.fill;
      ctx.fill();
    };

    /* Task Manager samples ~2×/s — one point per FRAME scrolled the whole
       60-sample history through in a second and burned a rAF loop forever. */
    const tick = () => {
      const last = dataR.current[dataR.current.length - 1];
      dataR.current.push(Math.min(100, Math.max(0, last + (Math.random() - 0.38) * 15)));
      if (dataR.current.length > 60) dataR.current.shift();
      draw();
    };
    tick();
    const id = setInterval(tick, 450);

    /* Instant redraw on theme toggle (no waiting for the next sample). */
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => { clearInterval(id); mo.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="perf-canvas" width={240} height={80} />;
}

function SysPropsContent() {
  const [tab, setTab] = useState('General');

  /* Same scrollIntoView pattern as About's goSkills / Skills' goProjects —
     a raw <a href="#skills"> hash-jumps instantly and leaves a URL hash,
     unlike every other "next section" link in the app. */
  const goSkills = () => {
    playClick();
    const t = document.getElementById('skills');
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="sysprop-tabs" role="tablist">
        {['General', 'Device Manager', 'Performance'].map(t => (
          <button key={t} role="tab" aria-selected={tab === t}
            className={`sysprop-tab${tab === t ? ' sysprop-tab-active' : ''}`}
            onClick={() => { playClick(); setTab(t); }}>
            {t}
          </button>
        ))}
      </div>
      <div className="sysprop-body">
        {tab === 'General' && (
          <>
            <div className="sysprop-logo-row">
              <OsComputer size={32} style={{ flexShrink:0 }} />
              <div className="sysprop-id">
                <div className="sysprop-os">SHREY/OS</div>
                <div className="sysprop-reg">Registered to: Shrey Patel</div>
                <div className="sysprop-reg">MSc AI · Brunel University London</div>
              </div>
            </div>
            <div className="sysprop-divider" />
            <div className="sysprop-specs">
              <div className="spec-row"><span className="spec-key">Processor:</span><span>Python 3.11 · PyTorch</span></div>
              <div className="spec-row"><span className="spec-key">Memory:</span><span>RAG · pgvector · Jina AI</span></div>
              <div className="spec-row"><span className="spec-key">System:</span><span>FastAPI · Supabase · Next.js</span></div>
              <div className="spec-row"><span className="spec-key">Display:</span><span>React · Vite · Plotly</span></div>
              <div className="spec-row"><span className="spec-key">Network:</span><span>Vercel · Railway · Prefect</span></div>
            </div>
            <div className="sysprop-divider" />
            <div className="sysprop-okrow">
              <button className="about-ok" aria-hidden="true" tabIndex={-1}>OK</button>
              <button className="about-ok" aria-hidden="true" tabIndex={-1}>Cancel</button>
            </div>
          </>
        )}
        {tab === 'Device Manager' && (
          <div className="dm-list">
            {DEVICE_MANAGER.map(group => (
              <div key={group.cat} className="dm-group">
                <div className="dm-cat">▼ {group.cat}</div>
                {group.items.map(item => (
                  <div key={item.n} className="dm-item">
                    <span className="dm-name">{item.n}</span>
                    <div className="dm-bar-wrap">
                      <div className="dm-bar">
                        <div className="dm-fill" style={{ width:`${item.p}%` }} />
                      </div>
                    </div>
                    <span className="dm-pct">{item.p}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {tab === 'Performance' && (
          <div className="perf-tab">
            <PerformanceGraph />
            <div className="perf-label">CPU Usage — Neural Activity</div>
            <div className="sysprop-divider" style={{ margin:'6px 0' }} />
            <div className="sysprop-specs">
              <div className="spec-row"><span className="spec-key">Physical:</span><span>Unlimited curiosity</span></div>
              <div className="spec-row"><span className="spec-key">Threads:</span><span>Mass-consuming research papers</span></div>
              <div className="spec-row"><span className="spec-key">Uptime:</span><span>Since 2021 · yr 1 of MSc @ Brunel</span></div>
            </div>
          </div>
        )}
        <button className="dm-open-monitor" onClick={goSkills}>
          Open System Monitor ↗
        </button>
      </div>
    </>
  );
}

function SelectionRect({ rect }) {
  if (!rect) return null;
  return <div className="sel-rect" style={{
    left:   Math.min(rect.x1, rect.x2),
    top:    Math.min(rect.y1, rect.y2),
    width:  Math.abs(rect.x2 - rect.x1),
    height: Math.abs(rect.y2 - rect.y1),
  }} />;
}

function MobileReveal({ children, onVisible, delay = 0 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true); onVisible?.();
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        onVisible?.();
        io.disconnect();
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [onVisible]);
  return (
    <div ref={ref} className={`mob-reveal${inView ? ' mob-in' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function MobileMenu({ onAction, theme, onToggleTheme, onOpenDisplay, muted, onToggleMute }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  const runIcon = (icon) => {
    playClick();
    setOpen(false);
    if (icon.dblAction) { onAction(icon.dblAction); return; }
    if (icon.href) {
      if (icon.download) {
        const a = document.createElement('a');
        a.href = icon.href; a.download = icon.download;
        document.body.appendChild(a); a.click(); a.remove();
      } else if (icon.href.startsWith('#')) {
        window.location.hash = icon.href.slice(1);
      } else {
        window.location.href = icon.href;
      }
    }
  };

  return (
    <>
      <div className="mob-topbar">
        <button className="mob-burger" aria-label="Open menu" aria-expanded={open}
          onClick={() => { playClick(); setOpen(v => !v); }}>
          <span /><span /><span />
        </button>
        <span className="mob-topbar-brand">SHREY/OS</span>
        <div className="mob-topbar-spacer" />
        <button className="mob-topbar-btn" aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => { playClick(); onToggleMute(); }}>
          {muted ? <PxVolumeMute size={24} /> : <PxVolume size={24} />}
        </button>
        <button className="mob-topbar-btn" aria-label="Toggle theme"
          onClick={() => { playClick(); onToggleTheme(); }}>
          {theme === 'dark' ? <PxLightbulbOff size={24} /> : <PxLightbulb size={24} />}
        </button>
      </div>

      {open && (
        <div className="mob-drawer-back" onClick={() => setOpen(false)}>
          <nav className="mob-drawer" onClick={(e) => e.stopPropagation()}
            aria-label="Desktop icons">
            <div className="mob-drawer-head">
              <span className="mob-drawer-title">SHREY/OS</span>
              <button className="mob-drawer-close" aria-label="Close menu"
                onClick={() => { playClick(); setOpen(false); }}>✕</button>
            </div>

            <div className="mob-drawer-list">
              {DESKTOP_ICONS.map((icon) => (
                (() => { const MIco = WIN98[icon.id]; return (
                <button key={icon.id} className="mob-drawer-item"
                  onClick={() => runIcon(icon)}>
                  <MIco className="mob-drawer-ico" size={48} />
                  <span>{icon.label}</span>
                </button>
                ); })()
              ))}
            </div>

            <div className="mob-drawer-sep" />

            <button className="mob-drawer-item"
              onClick={() => { playClick(); setOpen(false); onOpenDisplay(); }}>
              <span className="mob-drawer-ico mob-drawer-ico-emoji"><OsDisplaySet size={32} /></span>
              <span>Display Properties…</span>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}

function MobileHero({ shared }) {
  const { clock, muted, onToggleMute, handleAction, wins, wAction,
          contactOpen, setContactOpen,
          reducedMotion,
          theme, onToggleTheme, onOpenDisplay } = shared;
  const [notepadSeen, setNotepadSeen] = useState(false);
  const onNotepadVisible = useCallback(() => setNotepadSeen(true), []);

  /* Justified lockup on mobile too: PATEL is scaled to SHREY's exact width
     (both lines are centred by the parent, so origin-centre scaling keeps
     them concentric AND edge-aligned). Re-runs when fonts land or on resize. */
  const mobShreyRef = useRef(null);
  const mobPatelRef = useRef(null);
  useEffect(() => {
    const fit = () => {
      const sEl = mobShreyRef.current, pEl = mobPatelRef.current;
      if (!sEl || !pEl) return;
      pEl.style.transform = 'none';
      const ws = sEl.getBoundingClientRect().width;
      const wp = pEl.getBoundingClientRect().width;
      if (ws > 0 && wp > 0) pEl.style.transform = `scaleX(${(ws / wp).toFixed(4)})`;
    };
    fit();
    document.fonts?.ready?.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Sticky single-element morph: one Paint window whose chrome fades in as the
  // track scrolls, turning the bare hero figure into a framed Paint window. No
  // measurement — pure custom-prop + transform on fixed-size elements.
  const mobTrackRef  = useRef(null);
  const mobHolderRef = useRef(null);
  const mobNameRef   = useRef(null);

  useEffect(() => {
    const track  = mobTrackRef.current;
    const holder = mobHolderRef.current;
    const name   = mobNameRef.current;
    if (!track || !holder) return;
    // CRITICAL: the reveal/dock vars MUST be set on the WINDOW element, not the
    // holder — `.win95-window { --chrome-reveal: 1 }` redefines the variable on
    // the window itself, which shadows anything inherited from an ancestor.
    // (Desktop works because it sets the var inline on the window.)
    const winEl = holder.querySelector('.paint-window-hero') || holder;

    // ── Robust photo-centring offset ─────────────────────────────────────────
    // The Paint chrome is ASYMMETRIC (toolbar left, scrollbars right, titlebar+
    // menu above, palette+statusbar below), so the canvas centre is offset from
    // the window centre. When we scale the window up at the hero pose, that
    // offset is magnified and the photo drifts off-centre. We cancel it by
    // translating the holder by −offset·scale, easing to 0 as it docks.
    //
    // The offset is measured with getBoundingClientRect in a NEUTRAL (scale-1,
    // no-compensation) transform. Unlike an offsetLeft/offsetParent walk, this
    // reports true rendered geometry and does NOT depend on the window being a
    // positioned element — the previous approach silently overshot to the page
    // root whenever `.win95-static` (position:static) won the cascade, flinging
    // the figure off-screen. Chrome fades by OPACITY (fixed footprint), so the
    // offset is stable at any reveal; we only re-measure on resize.
    const off = { x: 0, y: 0 };
    const measure = () => {
      const canvasEl = winEl.querySelector('.paint-canvas');
      if (!canvasEl) { off.x = 0; off.y = 0; return; }
      const prev = holder.style.transform;
      holder.style.transform = 'translate(-50%, -50%)';   // neutral: scale 1, no comp
      const wr = winEl.getBoundingClientRect();
      const cr = canvasEl.getBoundingClientRect();
      off.x = (cr.left + cr.width  / 2) - (wr.left + wr.width  / 2);
      off.y = (cr.top  + cr.height / 2) - (wr.top  + wr.height / 2);
      holder.style.transform = prev;                      // apply() resets it immediately
    };

    // Reduced motion: jump straight to the docked (framed) state.
    if (reducedMotion) {
      winEl.style.setProperty('--chrome-reveal', '1');
      winEl.style.setProperty('--fig-dock', '1');
      holder.style.transform = 'translate(-50%, -50%)';
      if (name) name.style.opacity = '0';
      return;
    }

    let raf = null;
    const apply = () => {
      raf = null;
      const vh    = window.innerHeight;
      const total = track.offsetHeight - vh;                 // scroll distance in track
      const top   = track.getBoundingClientRect().top;       // 0 at start, negative as we pass
      const mp    = total > 0 ? Math.min(1, Math.max(0, -top / total)) : 0;
      const e     = easeInOut(mp);
      // Chrome holds OFF at the very start (bare frameless figure, exactly like
      // the desktop hero), then assembles once the figure has begun docking.
      const chrome = easeOut(clamp01((mp - 0.30) / 0.70));
      winEl.style.setProperty('--chrome-reveal', String(chrome));
      winEl.style.setProperty('--fig-dock', String(e));
      // Scale the window up at the hero pose, easing to its true docked size.
      // Photo-centring compensation eases to 0 as it docks (framed window
      // centres itself).
      const sc = lerp(1.18, 1, e);
      const compX = -off.x * sc * (1 - e);
      const compY = -off.y * sc * (1 - e);
      holder.style.transform =
        `translate(calc(-50% + ${compX.toFixed(1)}px), calc(-50% + ${compY.toFixed(1)}px)) scale(${sc.toFixed(3)})`;
      // Name shrinks + fades out behind the figure as it frames up.
      if (name) {
        name.style.transform = `translate(-50%, -50%) scale(${lerp(1, 0.5, e).toFixed(3)})`;
        name.style.opacity   = String(lerp(1, 0, clamp01(mp / 0.5)));
      }
      // Folder buttons + hint stay visible throughout — persistent navigation.
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const onResize = () => { measure(); if (!raf) raf = requestAnimationFrame(apply); };
    measure();
    apply();
    // Re-measure once images/fonts settle (canvas box can shift on first load).
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div className="mobile-root">
      <ContactWindow
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        cvHref={cvHref}
        onSound={playClick}
        onSent={playWhoosh}
      />

      <MobileMenu
        onAction={handleAction}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenDisplay={onOpenDisplay}
        muted={muted}
        onToggleMute={onToggleMute}
      />

      {/* Mobile hero — ONE element morph, mirroring the desktop Paint-as-figure.
          A sticky stage holds a single Paint window whose chrome is invisible at
          the top of the track (so only the figure shows, reading as the hero) and
          fades in as you scroll, framing that same figure inside Paint. There is
          exactly one figure on the page, so it never doubles. */}
      <div className="mob-cine-track" ref={mobTrackRef}>
        <div className="mob-cine-sticky">
          <div className="mob-stage">
            <h1 className="mob-name" ref={mobNameRef}>
              <span className="mob-name-line mob-shrey" ref={mobShreyRef}>SHREY</span>
              <span className="mob-name-line mob-patel" ref={mobPatelRef}>PATEL</span>
            </h1>
            <div className="mob-paint-holder" ref={mobHolderRef}>
              <StaticWindow title="untitled - Paint" titleIcon={<OsPaint className="title-ico-img" size={16} />}
                            className="paint-window-hero mob-paint">
                <PaintContent fx={false} />
              </StaticWindow>
            </div>
          </div>
          <div className="mob-hero-foot">
            <div className="folder-btns-desktop mob-folders">
              <FolderButton label="./run projects.exe" onAction={() => handleAction('projects')} />
              <FolderButton label="cat resume.pdf"     href={cvHref} download="Shrey_Patel_CV.pdf" />
            </div>
            <div className="scroll-hint mob-hint">↓ scroll to explore SHREY/OS ↓</div>
          </div>
        </div>
      </div>

      <section className="mob-stack">
        <MobileReveal onVisible={onNotepadVisible} delay={60}>
          <StaticWindow title="README.TXT - Notepad" titleIcon={<OsTextEditor className="title-ico-img" size={16} />}>
            <NotepadContent active={notepadSeen} instant={reducedMotion} />
          </StaticWindow>
        </MobileReveal>

        <MobileReveal delay={60}>
          <StaticWindow title="System Properties" titleIcon={<OsComputer className="title-ico-img" size={16} />}>
            <SysPropsContent />
          </StaticWindow>
        </MobileReveal>
      </section>
    </div>
  );
}

export default function HeroSection() {
  const {
    vp, isMobile, reducedMotion,
    theme, toggleTheme,
    clock, muted, toggleMute,
    ctxMenu, setCtxMenu,
    contactOpen, setContactOpen,
    setDisplayOpen,
    wins, wAction, focusedWin, setFocusedWin, stage, setStage,
    handleAction,
  } = useOS();
  const [selRect, setSelRect] = useState(null);

  const desktopRef     = useRef(null);
  const dragging       = useRef(false);
  const dragStart      = useRef({ x:0, y:0 });
  const shreyRefs      = useRef([]);
  const patelRefs      = useRef([]);
  const typedR         = useRef('');
  const lastActivityR  = useRef(Date.now());
  const stageR         = useRef(stage);
  const trackRef       = useRef(null);
  const progressR      = useRef(reducedMotion ? 1 : 0);
  const targetPRef     = useRef(reducedMotion ? 1 : 0);   // raw scroll target
  const smoothPRef     = useRef(reducedMotion ? 1 : 0);   // eased displayed value
  const soundArmedR    = useRef(false);   // no window-open pops before first real scroll

  // Choreographed element refs (written imperatively — no re-render on scroll)
  const bigNameRef    = useRef(null);
  const nameMorphRef  = useRef(null);   // 0-size anchor point at the name's centre
  const shreyWordRef  = useRef(null);
  const patelWordRef  = useRef(null);
  const subtitleRef   = useRef(null);
  const hintRef       = useRef(null);
  const foldersRef    = useRef(null);
  const paintWinRef   = useRef(null);
  const noteWinRef    = useRef(null);
  const sysWinRef     = useRef(null);
  const metricsRef    = useRef(null);
  const magClearedR   = useRef(false);  // magnetic-letter offsets cleared once morph starts

  useEffect(() => { stageR.current = stage; }, [stage]);

  /* ── Responsive layout — recomputed on EVERY resize (v1 computed once). ──
     Left column (~60vw) holds Paint; right column holds Notepad with
     SysProps docked beneath its MEASURED bottom edge (v1 estimated it).   */
  const layout = useMemo(() => {
    const W = vp.w, H = vp.h;
    const headerH    = 96;                        // clearance for the shrunk wordmark
    const iconGutter = 104;                       // desktop icon column clearance
    const topY       = headerH + 12;

    /* Two MIRRORED columns. leftCenter clears the icon gutter; rightCenter is
       its exact mirror (W - leftCenter). Paint sits centred in the left half;
       Notepad + System Properties share the right-half centre and stack. This
       symmetry is what makes both halves read as deliberate "columns". */
    const leftCenter  = Math.max(iconGutter + 168, Math.round(W * 0.30));
    const rightCenter = W - leftCenter;

    // Similar widths across both columns keep the composition balanced.
    const colW   = Math.min(430, Math.max(280, Math.round(W * 0.30)));
    const paintW = colW;
    const noteW  = colW;
    const sysW   = Math.min(colW, 410);

    const paintL = Math.max(iconGutter, Math.round(leftCenter  - paintW / 2));
    const noteL  = Math.min(W - noteW - 12, Math.round(rightCenter - noteW / 2));
    const sysL   = Math.round(rightCenter - sysW / 2);

    return {
      headerH, W, H, topY,
      leftCenter, rightCenter,
      paint:    { x: paintL, y: topY, w: paintW, z: 10 },
      notepad:  { x: noteL,  y: topY, w: noteW,  z: 11 },
      sysprops: { x: sysL,   y: topY + 300, w: sysW, z: 9 },  // provisional; docked by measure
    };
  }, [vp]);

  /* ── Measure real geometry → choreography metrics. Runs after layout is
     applied and whenever the viewport changes. offsetWidth/Height/Left/Top
     ignore transforms, so mid-scroll measurement stays exact.            */
  const measureAll = useCallback(() => {
    const paintEl = paintWinRef.current;
    const noteEl  = noteWinRef.current;
    const sysEl   = sysWinRef.current;
    const foldEl  = foldersRef.current;
    if (!paintEl || !noteEl || !foldEl) return;

    const TASK = 32, BM = 14, GAP = 40;   // taskbar, bottom margin, stack gap
    const TOP  = layout.topY;

    /* ── 2×2 MODULAR GRID ────────────────────────────────────────────────────
       Row 1: Paint | Notepad  (tops already aligned at layout.topY)
       Row 2: Folders | System Properties  (share ONE baseline)
       We grow the Notepad's text area so its bottom reaches toward Paint's,
       giving the top row near-equal heights, then dock the bottom row of BOTH
       columns to a single Y. Everything still fits inside one viewport.     */
    const sysH = sysEl ? sysEl.offsetHeight : 260;
    const fW = foldEl.offsetWidth, fH = foldEl.offsetHeight;
    // Chrome height measured from the live DOM (window minus its content area)
    // so CSS padding changes can never silently break the 2x2 grid docking.
    const noteContentEl = noteEl?.querySelector?.('.notepad-content');
    const NOTE_CHROME = (noteEl && noteContentEl)
      ? Math.max(40, noteEl.offsetHeight - noteContentEl.offsetHeight)
      : 18 + 22 + 27 + 18 + 8;   // fallback: titlebar+menu+headline+status+pad
    const paintBottom = layout.paint.y + paintEl.offsetHeight;

    // Deepest the bottom row can start while its taller cell (SysProps) still fits.
    const bottomRowMaxY = layout.H - TASK - BM - Math.max(sysH, fH);
    // Aim Notepad's bottom at Paint's bottom, but never below what leaves room
    // for the bottom row beneath it.
    const targetNoteBottom = Math.min(paintBottom, bottomRowMaxY - GAP);
    let noteContentH = targetNoteBottom - layout.notepad.y - NOTE_CHROME;
    noteContentH = Math.max(150, Math.min(noteContentH, Math.round(layout.H * 0.40)));
    noteEl.style.setProperty('--note-h', noteContentH + 'px');

    // offsetHeight read AFTER setting the var forces reflow → exact new height.
    const noteBottom = layout.notepad.y + noteEl.offsetHeight;

    // The single shared baseline for row 2 (under the taller of the two windows).
    const bottomRowY = Math.min(Math.max(paintBottom, noteBottom) + GAP, bottomRowMaxY);

    // Dock System Properties at the baseline (its top aligns with the folders' top).
    if (sysEl) sysEl.style.top = Math.max(TOP, bottomRowY) + 'px';

    // Folder waypoints (as translate deltas from the block's natural centre position).
    // wp[0] = rest (natural centre, delta 0,0)
    // wp[1] = RIGHT of Paint — same vertical as Paint centre, horizontally in right column
    // wp[2] = below Notepad
    // wp[3] = below Paint (final resting spot, left column)
    const natCx = foldEl.offsetLeft + fW / 2;
    const natCy = foldEl.offsetTop  + fH / 2;
    // wp[1]: folders appear beside Paint on the right — right column, Paint vertical midpoint
    const paintMidY = layout.paint.y + paintEl.offsetHeight / 2;
    const w1 = { x: layout.rightCenter - natCx, y: paintMidY - natCy };
    // wp[2]: below Notepad
    const w2 = { x: layout.rightCenter - natCx, y: (noteBottom + GAP + fH / 2) - natCy };
    // wp[3]: final — left column, below Paint. MUST sit fully below the Paint
    // window's bottom edge with a real gap, AND fully above the taskbar so the
    // folder LABELS are never cropped off-screen. We first place its top at
    // paintBottom + GAP, then clamp its bottom to clear the taskbar + margin.
    const foldBottomLimit = layout.H - TASK - BM;            // lowest the block may reach
    let foldFinalY = paintBottom + GAP + fH / 2;             // ideal centre (top clears Paint)
    // If that would push the block's bottom under the taskbar, pull it up just
    // enough to fit. (Paint height is budgeted below so this rarely bites.)
    foldFinalY = Math.min(foldFinalY, foldBottomLimit - fH / 2);
    const w3 = { x: layout.leftCenter - natCx, y: foldFinalY - natCy };

    /* ── NAME MORPH METRICS (single element, continuous) ─────────────────────
       The wordmark is ONE element (bigNameRef) holding two words on a 0-size
       anchor (nameMorphRef). At rest it's HUGE and STACKED (SHREY over PATEL),
       centred on screen. It morphs continuously to SMALL + INLINE at the top.

       We measure, with all transforms cleared:
         • the anchor point's rest position (screen px)
         • each word's natural box (width/height at full size)
       From these we derive both the stacked layout and the inline layout, and
       the whole-block scale + translate to the top. applyProgress blends
       between them with ONE eased parameter — no threshold snaps. */
    let nameMetrics = null;
    if (bigNameRef.current && nameMorphRef.current && shreyWordRef.current && patelWordRef.current) {
      const prevT = bigNameRef.current.style.transform;
      bigNameRef.current.style.transform = 'none';
      const pr = nameMorphRef.current.getBoundingClientRect();  // 0-size ⇒ a point
      bigNameRef.current.style.transform = prevT;
      const hSh = shreyWordRef.current.offsetHeight || 120;
      const hPa = patelWordRef.current.offsetHeight || 120;
      const wShRaw = shreyWordRef.current.getBoundingClientRect().width || 1;
      const wPaRaw = patelWordRef.current.getBoundingClientRect().width || 1;
      nameMetrics = {
        wSh: wShRaw,  hSh,
        // JUSTIFIED LOCKUP: PATEL is horizontally scaled to SHREY's exact
        // width (transform-origin: left, applied in applyProgress), so both
        // lines share edges. All centring math therefore uses wSh for BOTH.
        wPa: wShRaw,  hPa,
        paSx: wShRaw / wPaRaw,
        gYstack: Math.round(hSh * 0.06),   // small vertical gap between stacked lines
        gXinline: Math.round(hSh * 0.34),  // horizontal gap between inline words
        anchorX: pr.left,                   // anchor point screen X (block centre)
        anchorY: pr.top,                    // anchor point screen Y (block centre)
        scale: TARGET_NAME_H / hSh,         // full → final small
        translateY: 46 - pr.top,            // point → 46px from top
      };
    }

    /* ── PAINT-AS-FIGURE METRICS ─────────────────────────────────────────────
       The Paint window IS the hero figure. We need the transform that takes it
       from its rest (desktop slot, measured) to its p=0 "figure" pose: scaled
       up and centred so the photo reads as a standing person. Everything is
       measured/proportional — no fixed magic numbers.

       figScale: how much bigger the window is at p=0. Chosen so the photo's
         height ≈ 82% of the viewport (a tall standing figure), derived from the
         window's measured height.
       figDX/figDY: translation (px) from the window's rest centre to the screen
         centre-ish figure position at p=0. The figure sits slightly left of
         centre (matching the reference) and vertically centred. */
    let paintFig = null;
    {
      const pw = paintEl.offsetWidth;
      const ph = paintEl.offsetHeight;
      const restCx = layout.paint.x + pw / 2;
      const restCy = layout.paint.y + ph / 2;
      // Scale is modest and clamped so the window never bleeds off-screen.
      const rawScale = (0.82 * layout.H) / ph;
      const figScale = Math.max(1, Math.min(1.6, rawScale));
      // Centre the PHOTO (canvas), not the window: with chrome invisible the
      // photo is the only visible thing, so it must sit at the figure point
      // with the name behind it. The canvas is offset within the window
      // (toolbar left, menu above), so we measure that offset and solve:
      //   canvasScreenC = winRestC + (canvasRestC − winRestC)·s + translate
      //   translate     = figC − winRestC − (canvasRestC − winRestC)·s
      // offsetLeft/Top chains ignore transforms, so this is scroll-safe.
      let canvasOffX = 0, canvasOffY = 0;   // canvas centre − window centre
      const canvasEl = paintEl.querySelector('.paint-canvas');
      if (canvasEl) {
        let ox = 0, oy = 0, n = canvasEl;
        while (n && n !== paintEl) { ox += n.offsetLeft; oy += n.offsetTop; n = n.offsetParent; }
        canvasOffX = (ox + canvasEl.offsetWidth  / 2) - pw / 2;
        canvasOffY = (oy + canvasEl.offsetHeight / 2) - ph / 2;
      }
      const figCx = layout.W * 0.5;
      const figCy = layout.H * 0.48;
      paintFig = {
        restCx, restCy,
        figScale,
        figDX: figCx - restCx - canvasOffX * figScale,
        figDY: figCy - restCy - canvasOffY * figScale,
      };
    }

    metricsRef.current = {
      wp: [ {x:0, y:0}, w1, w2, w3 ],
      noteEnterX: (layout.W - layout.notepad.x) + 100,
      name: nameMetrics,
      paintFig,
      paintBox: {
        x: layout.paint.x, y: layout.paint.y,
        w: paintEl.offsetWidth, h: paintEl.offsetHeight,
      },
    };
  }, [layout]);

  /* ══════════════════════════════════════════════════════════════════════════
     UNIFIED CHOREOGRAPHY — single function of raw scroll p (0→1).
     All elements are driven here; no split hero/desktop systems.
     Called every rAF tick and after measure.
  ══════════════════════════════════════════════════════════════════════════ */
  const applyProgress = useCallback(p => {
    const m = metricsRef.current;
    if (!m) return;

    // ── SCROLL HINT ──────────────────────────────────────────────────────────
    if (hintRef.current) {
      const o = 1 - seg(p, S.hint);
      hintRef.current.style.opacity = o;
      hintRef.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    }

    // ── DESKTOP REVEAL ───────────────────────────────────────────────────────
    // Icons/taskbar/background were faded out under the (now-removed) overlay;
    // reveal them very early since the hero content now lives on the desktop
    // itself. Ramp 0→1 over the first sliver of scroll.
    if (desktopRef.current) {
      desktopRef.current.style.setProperty('--desk-reveal', String(easeOut(seg(p, [0, 0.06]))));
    }

    // ── NAME — ONE element, ONE continuous morph ─────────────────────────────
    // The wordmark morphs from HUGE + STACKED + CENTRED to SMALL + INLINE + TOP.
    // A single eased parameter `tn` drives EVERYTHING continuously:
    //   • block scale    1 → nm.scale
    //   • block position centre → top (measured translateY)
    //   • word layout    stacked (vertical offsets) → inline (horizontal offsets)
    // The stacked→inline blend is a continuous interpolation of each word's
    // (x,y) offset — NOT a flex-direction switch — so there is no snap. SHREY
    // slides from (above-centre) to (left-of-centre); PATEL from (below-centre)
    // to (right-of-centre), while the whole block shrinks and rises as one.
    const nm = m.name;
    const tn = easeInOut(seg(p, S.name));
    if (nm && bigNameRef.current) {
      // Whole-block transform: scale about centre + rise to measured top spot.
      bigNameRef.current.style.transform =
        `translateY(${lerp(0, nm.translateY, tn)}px) scale(${lerp(1, nm.scale, tn)})`;

      // Words are absolutely positioned on a 0-size anchor (their top-left = the
      // anchor point). All offsets below are UNSCALED px; the block scale shrinks
      // them visually. Two layouts, blended continuously by tn:
      //
      //   STACKED (tn=0): both centred horizontally; SHREY above, PATEL below.
      //   INLINE  (tn=1): both on one baseline; centred as a pair, SHREY left.
      //
      const totalW = nm.wSh + nm.gXinline + nm.wPa;   // inline pair width
      if (shreyWordRef.current) {
        const startX = -nm.wSh / 2;                             // centred-x
        const endX   = -totalW / 2;                             // left of pair
        const startY = -(nm.hSh + nm.gYstack / 2);             // above anchor
        const endY   = -nm.hSh / 2;                             // vertical centre
        shreyWordRef.current.style.transform =
          `translate(${lerp(startX, endX, tn)}px, ${lerp(startY, endY, tn)}px)`;
      }
      if (patelWordRef.current) {
        const startX = -nm.wPa / 2;                             // centred-x
        const endX   = -totalW / 2 + nm.wSh + nm.gXinline;     // right of pair
        const startY = nm.gYstack / 2;                          // below anchor
        const endY   = -nm.hPa / 2;                             // vertical centre
        patelWordRef.current.style.transform =
          `translate(${lerp(startX, endX, tn)}px, ${lerp(startY, endY, tn)}px) scaleX(${nm.paSx || 1})`;
        // PATEL is an outline at the hero pose and fills to solid as it docks,
        // matching the mockup's .l2 stroke→fill at the morph tail.
        if (tn > 0.6) {
          // Solid pose keeps the same 1.2px weight-stroke as SHREY (real 700
          // + stroke = the old faux-900 mass, without the rightward smear).
          patelWordRef.current.style.webkitTextStroke = '1.2px var(--ink, #F4F1EA)';
          patelWordRef.current.style.color = 'var(--ink, #F4F1EA)';
        } else {
          patelWordRef.current.style.webkitTextStroke = '2.4px var(--ink, #F4F1EA)';
          patelWordRef.current.style.color = 'transparent';
        }
      }

      // Clear magnetic per-letter offsets once the morph starts moving.
      if (tn > 0.001 && !magClearedR.current) {
        [...shreyRefs.current, ...patelRefs.current].forEach(el => { if (el) el.style.transform = ''; });
        magClearedR.current = true;
      } else if (tn <= 0.001) { magClearedR.current = false; }
    }

    // ── SUBTITLE — grows out of the name baseline in the SAME motion ─────────
    // Instead of popping in, the subtitle scales up from 0 and fades in as the
    // name settles, tied to the tail of the name morph so it feels like one
    // continuous reveal (name lands → its tagline unfurls beneath it).
    if (subtitleRef.current) {
      const st = easeOut(seg(p, S.subtitle));
      subtitleRef.current.style.opacity   = String(st);
      subtitleRef.current.style.transform = `translateX(-50%) scale(${lerp(0.82, 1, st)})`;
    }

    // ── FIGURE = PAINT WINDOW — ONE element, ONE continuous morph ────────────
    // At p=0 the Paint window is scaled up + centred with chrome invisible
    // (--chrome-reveal 0) → it reads as a standing figure. As p rises it scales
    // down into its measured desktop slot while the chrome fades in. The photo
    // inside never transfers between elements — the figure IS the window.
    const pf = m.paintFig;
    const tf = easeInOut(seg(p, S.paint));
    if (paintWinRef.current && pf) {
      const sc = lerp(pf.figScale, 1, tf);
      const dx = lerp(pf.figDX, 0, tf);
      const dy = lerp(pf.figDY, 0, tf);
      // Scale about the window centre so it grows/shrinks uniformly like one object.
      paintWinRef.current.style.transformOrigin = 'center center';
      paintWinRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
      paintWinRef.current.style.opacity   = '1';
      // Chrome reveal: invisible at figure pose → full as it docks. Slightly
      // delayed + faster so the frame "assembles" as the window nears its slot.
      const chromeReveal = easeOut(clamp01((tf - 0.35) / 0.65));
      paintWinRef.current.style.setProperty('--chrome-reveal', String(chromeReveal));
      // Dock progress for the SpotlightFigure: 0 at the hero pose, 1 when docked.
      // Drives the grayscale→RGB base cross-fade and the reveal-layer inversion.
      // Also drives the figure's bottom soft-fade mask (full photo w/ soft edge
      // at the hero pose → hard-cropped inside the frame once docked).
      paintWinRef.current.style.setProperty('--fig-dock', String(tf));
      // Once the window has largely assembled, crop the photo to the framed
      // head-and-shoulders look; before that the full standing figure shows.
      paintWinRef.current.classList.toggle('fig-docked', tf >= 0.5);
    }

    // ── FOLDERS — fade in beside Paint → below Notepad → below Paint ─────────
    const foldAlpha = easeOut(seg(p, S.fold0));
    const f1 = easeOut(seg(p, S.fold0));   // rest → beside Paint (with fade-in)
    const f2 = easeOut(seg(p, S.fold1));   // beside Paint → below Notepad
    const f3 = easeOut(seg(p, S.fold2));   // below Notepad → below Paint (final)
    let fx, fy;
    if (f3 > 0)      { fx = lerp(m.wp[2].x, m.wp[3].x, f3); fy = lerp(m.wp[2].y, m.wp[3].y, f3); }
    else if (f2 > 0) { fx = lerp(m.wp[1].x, m.wp[2].x, f2); fy = lerp(m.wp[1].y, m.wp[2].y, f2); }
    else             { fx = lerp(m.wp[0].x, m.wp[1].x, f1); fy = lerp(m.wp[0].y, m.wp[1].y, f1); }
    if (foldersRef.current) {
      foldersRef.current.style.opacity   = String(foldAlpha);
      foldersRef.current.style.transform = `translate(${fx}px, ${fy}px)`;
    }

    // ── NOTEPAD — slides in from right ──────────────────────────────────────
    const tt = easeOutExpo(seg(p, S.note));
    if (noteWinRef.current) {
      noteWinRef.current.style.transform =
        `translate(${lerp(m.noteEnterX, 0, tt)}px, ${lerp(24, 0, tt)}px) rotate(${lerp(2.2, 0, tt)}deg) scale(${lerp(0.96, 1, tt)})`;
      noteWinRef.current.style.opacity = String(Math.min(1, tt * 2));
      noteWinRef.current.style.filter  = tt < 0.9 ? `blur(${lerp(6, 0, tt)}px)` : 'none';
    }

    // ── SYSTEM PROPERTIES — rises in below Notepad ──────────────────────────
    const ts = easeOutExpo(seg(p, S.sys));
    if (sysWinRef.current) {
      sysWinRef.current.style.transform = `translateY(${lerp(32, 0, ts)}px) scale(${lerp(0.96, 1, ts)})`;
      sysWinRef.current.style.opacity   = String(ts);
      sysWinRef.current.style.filter    = ts < 0.9 ? `blur(${lerp(5, 0, ts)}px)` : 'none';
    }
  }, []);  // no deps — reads refs only

  /* Discrete stage (taskbar buttons, sounds, terminal start). Hysteresis
     prevents flicker at thresholds. Window-open sound on upward crossing only. */
  const updateStage = useCallback(p => {
    let s = stageR.current;
    while (s < 3 && p >= STAGE_UP[s]) s++;
    while (s > 0 && p <  STAGE_UP[s - 1] - STAGE_HYST) s--;
    if (s !== stageR.current) {
      if (s > stageR.current && soundArmedR.current) playWindowOpen();
      stageR.current = s;
      setStage(s);
    }
  }, []);

  // Layout application + measurement (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const raf = requestAnimationFrame(() => {
      measureAll();
      applyProgress(progressR.current);
    });
    // Re-measure once webfonts land (name/window heights can shift a few px).
    document.fonts?.ready?.then(() => {
      measureAll();
      applyProgress(progressR.current);
    });
    return () => cancelAnimationFrame(raf);
  }, [isMobile, layout, measureAll, applyProgress]);

  // Scroll listener (desktop only) — INERTIA-SMOOTHED.
  // Raw scroll sets a target; a rAF loop eases the *displayed* progress toward
  // it (exponential smoothing). This decouples the animation from the OS scroll
  // step, so wheel/trackpad input feels fluid and weighted (Lenis/GSAP-like)
  // instead of stepping frame-to-frame. The loop sleeps when caught up.
  useEffect(() => {
    if (isMobile) return;
    if (reducedMotion) {
      progressR.current = 1;
      stageR.current = 3;
      setStage(3);
      const raf = requestAnimationFrame(() => { measureAll(); applyProgress(1); });
      return () => cancelAnimationFrame(raf);
    }

    const readTarget = () => {
      const el = trackRef.current;
      if (!el) return 0;
      const maxScroll = el.offsetHeight - window.innerHeight;
      return maxScroll > 0 ? clamp01((window.scrollY - el.offsetTop) / maxScroll) : 1;
    };

    let raf = null;
    const tick = () => {
      const target = targetPRef.current;
      const cur    = smoothPRef.current;
      const d      = target - cur;
      // Snap when within a sub-pixel-equivalent delta; otherwise ease 16%/frame.
      const next = Math.abs(d) < 0.0004 ? target : cur + d * 0.16;
      smoothPRef.current = next;
      progressR.current  = next;
      applyProgress(next);
      updateStage(next);
      if (Math.abs(target - next) > 0.0004) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;               // caught up → stop burning frames
      }
    };
    const ensureLoop = () => { if (raf == null) raf = requestAnimationFrame(tick); };

    const onScroll = () => {
      soundArmedR.current = true;
      targetPRef.current = readTarget();
      ensureLoop();
    };

    // Initialise silently (handles reload mid-page) without smoothing.
    targetPRef.current = smoothPRef.current = progressR.current = readTarget();
    applyProgress(progressR.current);
    updateStage(progressR.current);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [isMobile, reducedMotion, applyProgress, updateStage, measureAll]);






  // Right-click on desktop background
  const handleContextMenu = useCallback(e => {
    const t = e.target;
    if (t === desktopRef.current || t.classList.contains('desktop') || t.classList.contains('desktop-bg')) {
      e.preventDefault();
      setCtxMenu({ x:e.clientX, y:e.clientY });
    }
  }, []);

  /* Magnetic letters — rAF-batched, cached rects (v1 forced layout on every
     mousemove), and only while the big name is on screen (stage 0).        */
  const letterRectsR = useRef(null);
  const magRafR      = useRef(null);
  const magEvR       = useRef(null);

  const cacheLetterRects = useCallback(() => {
    // Only meaningful at rest (stage 0), when the wordmark is un-morphed. Rects
    // are read as-is (no per-letter transform toggling — that would fight the
    // word-level morph transforms that share these elements' ancestry).
    letterRectsR.current = [...shreyRefs.current, ...patelRefs.current]
      .filter(Boolean)
      .map(el => {
        const r = el.getBoundingClientRect();
        return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const raf = requestAnimationFrame(cacheLetterRects);
    window.addEventListener('resize', cacheLetterRects);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', cacheLetterRects); };
  }, [isMobile, layout, cacheLetterRects]);

  const handleMouseMove = useCallback(e => {
    if (stageR.current === 0 && letterRectsR.current) {
      magEvR.current = e;
      if (!magRafR.current) {
        magRafR.current = requestAnimationFrame(() => {
          magRafR.current = null;
          const ev = magEvR.current;
          const radius = 90;
          letterRectsR.current.forEach(({ el, cx, cy }) => {
            const dx = ev.clientX - cx, dy = ev.clientY - cy;
            const dist  = Math.sqrt(dx*dx + dy*dy);
            const force = Math.max(0, 1 - dist / radius);
            el.style.transform = `translate(${dx * force * 0.22}px, ${dy * force * 0.16}px)`;
          });
        });
      }
    }
    if (dragging.current) {
      setSelRect({ x1:dragStart.current.x, y1:dragStart.current.y, x2:e.clientX, y2:e.clientY });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    [...shreyRefs.current, ...patelRefs.current].forEach(el => {
      if (el) el.style.transform = 'translate(0,0)';
    });
  }, []);

  const handleMouseDown = useCallback(e => {
    if (e.button !== 0) return;
    const t = e.target;
    if (!t.classList.contains('desktop') && !t.classList.contains('desktop-bg') && t !== desktopRef.current) return;
    dragging.current = true;
    dragStart.current = { x:e.clientX, y:e.clientY };
    setSelRect({ x1:e.clientX, y1:e.clientY, x2:e.clientX, y2:e.clientY });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragging.current) { dragging.current = false; setSelRect(null); }
  }, []);




  // Clicking the hint scrolls to the first reveal — an obvious "start" affordance.
  const handleHintClick = useCallback(() => {
    playClick();
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + maxScroll * (S.paint[1] + 0.02), behavior: 'smooth' });
  }, []);

  /* Active ("focused") window. During the reveal the blue titlebar acts as a
     spotlight that walks through the story — Paint → Notepad → System Properties
     — as each stage lands. Once the visitor clicks a window, their choice wins. */
  const stageActive = stage >= 3 ? 'sysprops' : stage >= 2 ? 'notepad' : 'paint';
  const activeId = focusedWin || stageActive;

  /* ── MOBILE BRANCH ── */
  if (isMobile) {
    return (
      <MobileHero shared={{
        clock, muted, onToggleMute: toggleMute, handleAction, wins, wAction,
        contactOpen, setContactOpen,
        reducedMotion,
        theme, onToggleTheme: toggleTheme, onOpenDisplay: () => setDisplayOpen(true),
      }} />
    );
  }

  /* ── DESKTOP ── */
  return (
    <div className="scroll-track" ref={trackRef}>
    <div
      ref={desktopRef}
      className="desktop"
      onContextMenu={handleContextMenu}
      onClick={() => setCtxMenu(null)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <SelectionRect rect={selRect} />

      {/* Subtitle — fades in under the wordmark once it has shrunk to the top */}
      <div className="hero-subtitle" ref={subtitleRef} aria-hidden="true">AI / ML · LONDON</div>

      {/* Hero name (single morphing wordmark) + folder buttons — scrubbed by scroll */}
      <div className="desktop-bg" style={{ pointerEvents: 'none' }}>
        <h1 className="hero-name-big" ref={bigNameRef}>
          <div className="name-morph" ref={nameMorphRef}>
            <span className="name-word name-shrey" ref={shreyWordRef}>
              {'SHREY'.split('').map((ch, i) => (
                <span key={i} ref={el => { shreyRefs.current[i] = el; }} className="nletter"
                  style={{ animationDelay:`${0.42 + i * 0.04}s` }}>{ch}</span>
              ))}
            </span>
            <span className="name-word name-patel" ref={patelWordRef}>
              {'PATEL'.split('').map((ch, i) => (
                <span key={i} ref={el => { patelRefs.current[i] = el; }} className="nletter"
                  style={{ animationDelay:`${0.9 + i * 0.04}s` }}>{ch}</span>
              ))}
            </span>
          </div>
        </h1>
        <div className="folder-btns-desktop" ref={foldersRef} style={{ pointerEvents: 'auto' }}>
          <FolderButton label="./run projects.exe" onAction={() => handleAction('projects')} />
          <FolderButton label="cat resume.pdf"     href={cvHref} download="Shrey_Patel_CV.pdf" />
        </div>
      </div>

      <button className="scroll-hint" ref={hintRef} onClick={handleHintClick}>
        ↓ scroll to explore SHREY/OS ↓
      </button>

      {/* Windows — positions from responsive layout; motion from choreography */}
      <Win95Window
        title="untitled - Paint"
        titleIcon={<OsPaint className="title-ico-img" size={16} />}
        outerRef={paintWinRef}
        className="paint-window-hero"
        winId="paint" active={activeId === 'paint'} onFocus={setFocusedWin}
        x={layout.paint.x} y={layout.paint.y} z={layout.paint.z}
        open={wins.paint.open} minimized={wins.paint.minimized}
        onClose={() => wAction('paint', 'close')}
        onMinimize={() => wAction('paint', 'minimize')}
        style={{ width: layout.paint.w, '--chrome-reveal': 0, willChange: 'transform, opacity, filter' }}>
        <PaintContent />
      </Win95Window>

      <Win95Window
        title="README.TXT - Notepad"
        titleIcon={<OsTextEditor className="title-ico-img" size={16} />}
        outerRef={noteWinRef}
        winId="notepad" active={activeId === 'notepad'} onFocus={setFocusedWin}
        x={layout.notepad.x} y={layout.notepad.y} z={layout.notepad.z}
        open={wins.notepad.open} minimized={wins.notepad.minimized}
        onClose={() => wAction('notepad', 'close')}
        onMinimize={() => wAction('notepad', 'minimize')}
        style={{ width: layout.notepad.w, opacity: 0, willChange: 'transform, opacity, filter' }}>
        <NotepadContent active={stage >= 2} instant={reducedMotion} />
      </Win95Window>

      <Win95Window
        title="System Properties"
        outerRef={sysWinRef}
        winId="sysprops" active={activeId === 'sysprops'} onFocus={setFocusedWin}
        x={layout.sysprops.x} y={layout.sysprops.y} z={layout.sysprops.z}
        open={wins.sysprops.open} minimized={wins.sysprops.minimized}
        onClose={() => wAction('sysprops', 'close')}
        onMinimize={() => wAction('sysprops', 'minimize')}
        style={{ width: layout.sysprops.w, opacity: 0, willChange: 'transform, opacity, filter' }}>
        <SysPropsContent />
      </Win95Window>
    </div>
    </div>
  );
}