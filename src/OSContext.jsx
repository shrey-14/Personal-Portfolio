/* ══════════════════════════════════════════════════════════════════════════
   OSContext.jsx — shared OS state hub for SHREY/OS.
   Owns theme, wallpaper, clock, mute, window state, stage and every overlay
   flag, plus the boot/global effects. Writes data-theme on <html> so the whole
   document (hero + skills + every section) themes uniformly. Also exports the
   low-level OS helpers (sounds, useViewport) and shared data used by both the
   fixed layer and the hero.
   ═════════════════════════════════════════════════════════════════════════ */
import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import cvHref from './assets/Shrey_Patel_CV.pdf';
import {
  OsComputer, OsRecycleBin, OsFolder, OsPdf, OsMail,
} from './OsIcons.jsx';

export { cvHref };

let _muted    = false;
let _audioCtx = null;
function getAC() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playClick() {
  if (_muted) return;
  try {
    const ac = getAC();
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'square'; osc.frequency.value = 900;
    const t = ac.currentTime;
    g.gain.setValueAtTime(0.035, t);
    g.gain.linearRampToValueAtTime(0, t + 0.032);
    osc.start(t); osc.stop(t + 0.04);
  } catch (_) {}
}

/* Soft two-note "window open" pop — plays once per scroll stage crossed. */
function playWindowOpen() {
  if (_muted) return;
  try {
    const ac = getAC();
    const t = ac.currentTime;
    [[523.25, 0, 0.10], [784.0, 0.055, 0.12]].forEach(([f, d, dur]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + d);
      g.gain.linearRampToValueAtTime(0.055, t + d + 0.014);
      g.gain.linearRampToValueAtTime(0, t + d + dur);
      o.start(t + d); o.stop(t + d + dur + 0.02);
    });
  } catch (_) {}
}

function playStartupChime() {
  if (sessionStorage.getItem('shreyos_chime')) return;
  sessionStorage.setItem('shreyos_chime', '1');
  try {
    const ac = getAC();
    [[261.63, 0], [329.63, 0.38], [392.00, 0.76]].forEach(([freq, t]) => {
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.connect(g); g.connect(ac.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const s = ac.currentTime + t;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.10, s + 0.05);
      g.gain.linearRampToValueAtTime(0, s + 0.36);
      osc.start(s); osc.stop(s + 0.40);
    });
  } catch (_) {}
}

function playDialup(onDone) {
  const doFinish = () => setTimeout(() => onDone?.(), 200);
  if (_muted) { setTimeout(doFinish, 2200); return; }
  try {
    const ac = getAC();
    const master = ac.createGain();
    master.gain.value = 0.4;
    master.connect(ac.destination);
    let t = ac.currentTime;

    const tone = (f1, f2, start, dur, type = 'sine') => {
      [f1, f2].filter(Boolean).forEach(f => {
        const osc = ac.createOscillator(), g = ac.createGain();
        osc.connect(g); g.connect(master);
        osc.type = type; osc.frequency.value = f;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.28, start + 0.01);
        g.gain.setValueAtTime(0.28, start + dur - 0.01);
        g.gain.linearRampToValueAtTime(0, start + dur);
        osc.start(start); osc.stop(start + dur + 0.02);
      });
    };

    [[697,1336],[770,1209],[852,1477],[697,1336],[770,1477]].forEach(([r,c], i) => {
      tone(r, c, t + i * 0.17, 0.12);
    });
    t += 5 * 0.17 + 0.12;
    tone(440, 480, t, 0.5); t += 0.75;
    tone(2100, null, t, 0.38); t += 0.45;
    for (let i = 0; i < 9; i++) {
      const f = 600 + (i / 9) * 2000;
      tone(f, f + 350, t, 0.055 + (i % 3) * 0.018, i % 2 ? 'sawtooth' : 'sine');
      t += 0.065;
    }
    tone(2400, 1200, t, 0.25);
    setTimeout(doFinish, 2350);
  } catch (_) { doFinish(); }
}

/* Short upward "whoosh" — the sound of a message leaving. Shares the OS audio
   context so it obeys the same mute + first-gesture-unlock rules as everything. */
function playWhoosh() {
  if (_muted) return;
  try {
    const ac = getAC();
    const t = ac.currentTime;
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.22);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.start(t); osc.stop(t + 0.3);
  } catch (_) {}
}/* Icon system: full-colour SerenityOS pixel art on surfaces (see
   OsIcons.jsx); monochrome PixelIcons remain for inline/tray glyphs. */
const WIN98 = {
  mycomp:   OsComputer,
  recycle:  OsRecycleBin,
  projects: OsFolder,
  resume:   OsPdf,
  contact:  OsMail,
};

const DESKTOP_ICONS = [
  { id: 'mycomp',   label: 'My Computer',  dblAction: 'sysinfo' },
  { id: 'recycle',  label: 'Recycle Bin', dblAction: 'recycle' },
  { id: 'projects', label: 'Projects.exe', href: '#projects', dblAction: 'projects' },
  { id: 'resume',   label: 'Resume.pdf',   href: cvHref, download: 'Shrey_Patel_CV.pdf' },
  { id: 'contact',  label: 'Contact.exe',  dblAction: 'contact' },
];

function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
    // Coarse pointer = touch device. Combined with width, this makes the
    // mobile decision robust even on tablets / unusual DPRs.
    coarse: window.matchMedia('(pointer: coarse)').matches,
  }));
  useEffect(() => {
    let raf = null;
    const read = () => ({
      w: window.innerWidth,
      h: window.innerHeight,
      coarse: window.matchMedia('(pointer: coarse)').matches,
    });
    const onR = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setVp(read());
      });
    };
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return vp;
}
/* export shared low-level helpers + data for hero & fixed layers */
export {
  playClick, playWindowOpen, playStartupChime, playDialup, playWhoosh,
  useViewport, WIN98, DESKTOP_ICONS,
};

/* ══════════════════════════════════════════════════════════════════════════
   PROVIDER
  ══════════════════════════════════════════════════════════════════════════ */
const OSContext = createContext(null);

export function OSProvider({ children }) {
  const vp = useViewport();
  const isMobile = vp.w < 900 || (vp.coarse && vp.w < 1024);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = e => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const [clock,       setClock]       = useState('');
  const [ctxMenu,     setCtxMenu]     = useState(null);
  const [aboutOpen,   setAboutOpen]   = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [dialupOpen,  setDialupOpen]  = useState(false);
  const [dialupPhase, setDialupPhase] = useState('DIALING...');
  const [contactOpen, setContactOpen] = useState(false);
  const [bsodOpen,    setBsodOpen]    = useState(false);
  const [ssActive,    setSsActive]    = useState(false);
  const [stage,       setStage]       = useState(reducedMotion ? 3 : 0);
  const [focusedWin,  setFocusedWin]  = useState(null);
  const [wins,        setWins]        = useState({
    paint:    { open: true, minimized: false },
    notepad:  { open: true, minimized: false },
    sysprops: { open: true, minimized: false },
    about:      { open: false, minimized: false },
    sysmonitor: { open: false, minimized: false },
    explorer:   { open: false, minimized: false },
    journey:    { open: false, minimized: false },
    aiterminal: { open: false, minimized: false },
  });

  // Theme + wallpaper (persisted) + Display Properties dialog
  const [theme,       setTheme]       = useState(() => {
    try { return localStorage.getItem('shreyos_theme') || 'light'; } catch { return 'light'; }
  });
  const [wallpaperId, setWallpaperId] = useState(() => {
    try { return localStorage.getItem('shreyos_wallpaper') || 'teal'; } catch { return 'teal'; }
  });
  const [displayOpen, setDisplayOpen] = useState(false);
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);

  // Reflect theme on <html> so global.css themes EVERY section via [data-theme].
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Keep the mobile address-bar tint on the real graphite surfaces
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#1a1d23' : '#1b1e24');
    try { localStorage.setItem('shreyos_theme', theme); } catch {}
  }, [theme]);
  useEffect(() => {
    try { localStorage.setItem('shreyos_wallpaper', wallpaperId); } catch {}
  }, [wallpaperId]);

  const applyDisplay = useCallback((nextTheme, nextWp) => {
    setTheme(nextTheme); setWallpaperId(nextWp);
  }, []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  const toggleMute  = useCallback(() => setMuted(prev => { _muted = !prev; return !prev; }), []);

  const typedR = useRef('');
  const lastActivityR = useRef(Date.now());

  // Window state manager
  const wAction = useCallback((id, action) => {
    setWins(prev => {
      const w = prev[id];
      if (!w) return prev;
      if (action === 'open')     return { ...prev, [id]: { ...w, open: true,  minimized: false } };
      if (action === 'close')    return { ...prev, [id]: { ...w, open: false } };
      if (action === 'minimize') return { ...prev, [id]: { ...w, minimized: true } };
      if (action === 'toggle')   return { ...prev, [id]: { ...w, minimized: !w.minimized, open: true } };
      return prev;
    });
  }, []);

  // Clock
  useEffect(() => {
    const fmt = () => {
      const n = new Date(), h = n.getHours();
      return `${h % 12 || 12}:${String(n.getMinutes()).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    setClock(fmt());
    // Tick once per minute, aligned to the minute boundary — a per-second
    // interval re-rendered every useOS() consumer 60x/min for a display
    // that only shows minutes.
    let id;
    const schedule = () => {
      id = setTimeout(() => { setClock(fmt()); schedule(); },
        60000 - (Date.now() % 60000) + 50);
    };
    schedule();
    return () => clearTimeout(id);
  }, []);

  // Startup chime
  useEffect(() => {
    const id = setTimeout(() => { if (!reducedMotion) playStartupChime(); }, 900);
    return () => clearTimeout(id);
  }, [reducedMotion]);

  // BSOD: type "crash" or Alt+F4
  useEffect(() => {
    const onKey = e => {
      // Never hijack typing inside form fields — a visitor writing the word
      // "crash" in the Contact window must NOT be blue-screened mid-message.
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.altKey && e.key === 'F4') { e.preventDefault(); setBsodOpen(true); return; }
      typedR.current = (typedR.current + e.key).slice(-5).toLowerCase();
      if (typedR.current === 'crash') setBsodOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Screensaver: inactivity (desktop only; skipped entirely for
  // reduced-motion users — a bouncing DVD-logo is exactly what they opted out of)
  useEffect(() => {
    if (isMobile || reducedMotion) return;
    const resetActivity = () => { lastActivityR.current = Date.now(); };
    const check = setInterval(() => {
      if (!bsodOpen && Date.now() - lastActivityR.current > 5000) setSsActive(true);
    }, 1000);
    const evts = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    evts.forEach(e => document.addEventListener(e, resetActivity, { passive: true }));
    return () => { clearInterval(check); evts.forEach(e => document.removeEventListener(e, resetActivity)); };
  }, [bsodOpen, isMobile, reducedMotion]);

  /* Scroll to a section and pulse its window with the phosphor border —
     one shared implementation so every launcher behaves identically. */
  const gotoSection = useCallback((id, evt) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => window.dispatchEvent(new CustomEvent(evt)), 600);
  }, []);

  const handleAction = useCallback(action => {
    // My Computer (desktop icon) → the system dialog
    if (action === 'sysinfo')  { setCtxMenu(null); playClick(); setAboutOpen(true); }
    // Start menu "About" → the real Personnel File section
    if (action === 'about')    {
      setCtxMenu(null); playClick();
      gotoSection('about', 'shreyos-about-boot');
    }
    if (action === 'projects') {
      // Scroll to disk archive section + highlight it
      playClick();
      const el = document.getElementById('projects');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      // dispatch event so ProjectsSection can flash the cabinet
      setTimeout(() => window.dispatchEvent(new CustomEvent('shreyos-archive-boot')), 600);
    }
    if (action === 'open_project') {
      playClick(); playWindowOpen();
      setWins(w => ({ ...w, explorer: { open: true, minimized: false } }));
    }
    if (action === 'recycle')  { setCtxMenu(null); playClick(); setRecycleOpen(true); }
    if (action === 'shutdown') { setCtxMenu(null); playClick(); setShutdownOpen(true); }
    if (action === 'contact') {
      // Dial-up handshake FIRST (the boot animation), then land on the
      // Contact section with the same phosphor pulse as About / Projects.
      setCtxMenu(null);
      const phases = ['DIALING...', 'CONNECTING...', 'AUTHENTICATING...', 'CONNECTED!'];
      setDialupOpen(true);
      setDialupPhase(phases[0]);
      phases.forEach((p, i) => { if (i > 0) setTimeout(() => setDialupPhase(p), i * 540); });
      playDialup(() => {
        // Boot animation first, then straight into the official mail client
        // (ContactWindow.jsx) — not a scroll to the section.
        setTimeout(() => { setDialupOpen(false); setContactOpen(true); }, 400);
      });
    }
    // The Contact section's own CTA: same dial-up handshake, but it lands on
    // the mail COMPOSE window (the visitor is already at the section).
    if (action === 'contact_mail') {
      setCtxMenu(null);
      const phases = ['DIALING...', 'CONNECTING...', 'AUTHENTICATING...', 'CONNECTED!'];
      setDialupOpen(true);
      setDialupPhase(phases[0]);
      phases.forEach((p, i) => { if (i > 0) setTimeout(() => setDialupPhase(p), i * 540); });
      playDialup(() => {
        setTimeout(() => { setDialupOpen(false); setContactOpen(true); }, 400);
      });
    }
  }, [gotoSection]);

  // Buddy reactions to OS state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('shreyos-buddy',
      { detail: { type: contactOpen ? 'contact-open' : 'contact-close' } }));
  }, [contactOpen]);
  useEffect(() => {
    if (bsodOpen) window.dispatchEvent(new CustomEvent('shreyos-buddy', { detail: { type: 'bsod' } }));
  }, [bsodOpen]);

  // Memoised so consumers only re-render when state actually changes
  // (previously this object was rebuilt every render, once per clock tick).
  const value = useMemo(() => ({
    vp, isMobile, reducedMotion,
    theme, setTheme, toggleTheme, wallpaperId, setWallpaperId, applyDisplay,
    clock, muted, toggleMute,
    ctxMenu, setCtxMenu, aboutOpen, setAboutOpen,
    dialupOpen, dialupPhase, contactOpen, setContactOpen,
    bsodOpen, setBsodOpen, ssActive, setSsActive,
    displayOpen, setDisplayOpen, recycleOpen, setRecycleOpen,
    shutdownOpen, setShutdownOpen,
    wins, wAction, focusedWin, setFocusedWin, stage, setStage,
    handleAction, cvHref,
  }), [
    vp, isMobile, reducedMotion, theme, wallpaperId, clock, muted,
    ctxMenu, aboutOpen, dialupOpen, dialupPhase, contactOpen, bsodOpen,
    ssActive, displayOpen, recycleOpen, shutdownOpen, wins, focusedWin, stage,
    toggleTheme, applyDisplay, toggleMute, wAction, handleAction, gotoSection,
  ]);

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS() must be used inside <OSProvider>');
  return ctx;
}