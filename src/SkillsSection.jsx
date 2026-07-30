/* ══════════════════════════════════════════════════════════════════════════
   SkillsSection.jsx — "System Monitor.exe"  (SHREY/OS · section 03)
   ---------------------------------------------------------------------------
   THEME: this section no longer sets its own data-theme. Your OS writes
   data-theme on <html> (OSContext / hero), so light/dark cascades here for
   free — the earlier bug was this component pinning data-theme="dark" on its
   own root and overriding the page. The canvases can't read CSS custom props
   reliably, so `useHtmlTheme` mirrors the <html> value (and live-updates on
   toggle) purely to pick canvas colours.

   App usage:  <FixedComponents><HeroSection/><AboutSection/><SkillsSection/></FixedComponents>
   ═════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import useWindowDrag from './useWindowDrag';
import { useOS, playClick } from './OSContext';

/* ── self-hosted logos (src/assets/logos) ──────────────────────────────── */
import lPython     from './assets/logos/python.svg';
import lJavascript from './assets/logos/javascript.svg';
import lJava       from './assets/logos/java.svg';
import lC          from './assets/logos/c.svg';
import lSql        from './assets/logos/sql.svg';
import lPytorch    from './assets/logos/pytorch.svg';
import lTensorflow from './assets/logos/tensorflow.svg';
import lSklearn    from './assets/logos/scikitlearn.svg';
import lNumpy      from './assets/logos/numpy.svg';
import lPandas     from './assets/logos/pandas.svg';
import lOpencv     from './assets/logos/opencv.svg';
import lYolo       from './assets/logos/ultralytics.svg';
import lSpacy      from './assets/logos/spacy.svg';
import lNltk       from './assets/logos/nltk.svg';
import lFastapi    from './assets/logos/fastapi.svg';
import lNext       from './assets/logos/nextjs.svg';
import lSupabase   from './assets/logos/supabase.svg';
import lPostgres   from './assets/logos/postgresql.svg';
import lGroq       from './assets/logos/groq.svg';
import lJina       from './assets/logos/jina.svg';
import lTableau    from './assets/logos/tableau.svg';
import lMatplotlib from './assets/logos/matplotlib.svg';
import lPlotly     from './assets/logos/plotly.svg';
import lPowerbi    from './assets/logos/powerbi.svg';
import lExcel      from './assets/logos/excel.svg';
import lStreamlit  from './assets/logos/streamlit.svg';
import lGradio     from './assets/logos/gradio.svg';
import lPrefect    from './assets/logos/prefect.svg';
import lVercel     from './assets/logos/vercel.svg';
import lRailway    from './assets/logos/railway.svg';

/* ── live mirror of <html data-theme> (for canvas colours only) ─────────── */
function useHtmlTheme(fallback = 'dark') {
  const [t, setT] = useState(() =>
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || fallback);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setT(el.getAttribute('data-theme') || fallback);
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [fallback]);
  return t;
}

/* ── process groups — every field grounded in the CV ───────────────────────
   cpu / mem are playful "resource" telemetry (a Task-Manager metaphor,
   deliberately NOT a literal self-graded proficiency score). */
const GROUPS = [
  { cat: 'Languages', open: false, items: [
    { logo: lPython, name: 'Python', type: 'core', cpu: 95, mem: '214 MB', st: 'active',
      dl: 'Primary language across every project and my Petpooja internship.', meta: ['AI Radar', 'Road Damage', 'Petpooja'] },
    { logo: lSql, name: 'SQL', type: 'data', cpu: 88, mem: '150 MB', st: 'active',
      dl: 'Optimised 800+ BigQuery pipelines at Petpooja — 30% lower query latency.', meta: ['BigQuery', 'PostgreSQL', 'ETL'] },
    { logo: lJavascript, name: 'JavaScript', type: 'web', cpu: 74, mem: '96 MB', st: 'running',
      dl: 'Front-end logic for AI Radar and interactive apps.', meta: ['Next.js', 'Web'] },
    { logo: lJava, name: 'Java', type: 'lang', cpu: 58, mem: '70 MB', st: 'bg',
      dl: 'Object-oriented foundations through university coursework.', meta: ['BEng IT'] },
    { logo: lC, name: 'C', type: 'lang', cpu: 52, mem: '44 MB', st: 'bg',
      dl: 'Systems-level fundamentals from my undergraduate degree.', meta: ['BEng IT'] },
  ]},
  { cat: 'ML / Deep Learning', open: true, items: [
    { logo: lPytorch, name: 'PyTorch', type: 'framework', cpu: 86, mem: '188 MB', st: 'running',
      dl: 'Trained the YOLOv5 road-damage detector; deep-learning coursework.', meta: ['Road Damage', 'DL'] },
    { logo: lTensorflow, name: 'TensorFlow', type: 'framework', cpu: 78, mem: '170 MB', st: 'running',
      dl: 'Built ML models through university projects and the internship.', meta: ['Modelling'] },
    { logo: lSklearn, name: 'scikit-learn', type: 'ml', cpu: 80, mem: '120 MB', st: 'running',
      dl: 'Classical ML — training, evaluation and feature work.', meta: ['Modelling', 'Eval'] },
    { logo: lNumpy, name: 'NumPy', type: 'compute', cpu: 82, mem: '128 MB', st: 'running',
      dl: 'Numerical backbone underneath every data workflow.', meta: ['Arrays'] },
    { logo: lPandas, name: 'Pandas', type: 'data', cpu: 84, mem: '134 MB', st: 'running',
      dl: 'Data wrangling and analysis across projects and the internship.', meta: ['DataFrames'] },
  ]},
  { cat: 'Computer Vision & NLP', open: false, items: [
    { logo: lOpencv, name: 'OpenCV', type: 'vision', cpu: 79, mem: '132 MB', st: 'running',
      dl: 'Image processing and augmentation for the road-damage model.', meta: ['Road Damage', 'OpenCV'] },
    { logo: lYolo, name: 'YOLOv5 / v8', type: 'vision', cpu: 83, mem: '144 MB', st: 'active',
      dl: 'Object detection — YOLOv5 (road damage, 87% mAP) and YOLOv8 (hackathon).', meta: ['YOLOv5', 'YOLOv8', '87% mAP'] },
    { logo: lSpacy, name: 'spaCy', type: 'nlp', cpu: 72, mem: '88 MB', st: 'running',
      dl: 'NLP text extraction & validation pipelines during the internship.', meta: ['Petpooja', 'NLP'] },
    { logo: lNltk, name: 'NLTK', type: 'nlp', cpu: 70, mem: '82 MB', st: 'bg',
      dl: 'Tokenisation and language processing for prompt / OCR pipelines.', meta: ['NLP', 'Petpooja'] },
  ]},
  { cat: 'LLMs · Backend · APIs', open: false, items: [
    { logo: lFastapi, name: 'FastAPI', type: 'backend', cpu: 85, mem: '126 MB', st: 'active',
      dl: 'Async Python API serving the AI Radar backend.', meta: ['AI Radar', 'REST'] },
    { logo: lNext, name: 'Next.js', type: 'web', cpu: 77, mem: '118 MB', st: 'running',
      dl: 'Full-stack front-end for the AI Radar briefing platform.', meta: ['AI Radar', 'React'] },
    { logo: lGroq, name: 'Groq', type: 'inference', cpu: 81, mem: '74 MB', st: 'running',
      dl: 'Fast LLM inference — AI Radar summaries and LLaMA recipe generation.', meta: ['AI Radar', 'LLaMA'] },
    { logo: lJina, name: 'Jina AI', type: 'embed', cpu: 73, mem: '80 MB', st: 'running',
      dl: 'Embeddings powering AI Radar’s hybrid semantic + keyword RAG.', meta: ['AI Radar', 'RAG'] },
    { logo: lSupabase, name: 'Supabase', type: 'baas', cpu: 78, mem: '110 MB', st: 'running',
      dl: 'Auth, storage and Postgres backing AI Radar in production.', meta: ['AI Radar', 'Auth'] },
    { logo: lPostgres, name: 'PostgreSQL', type: 'db', cpu: 80, mem: '156 MB', st: 'running',
      dl: 'PostgreSQL + pgvector store behind the hybrid-RAG retrieval.', meta: ['pgvector', 'AI Radar'] },
  ]},
  { cat: 'Data & Visualisation', open: false, items: [
    { logo: lTableau, name: 'Tableau', type: 'bi', cpu: 74, mem: '104 MB', st: 'bg',
      dl: 'BI dashboards presenting clear analytical insight.', meta: ['BI', 'Analysis'] },
    { logo: lPowerbi, name: 'Power BI', type: 'bi', cpu: 72, mem: '100 MB', st: 'bg',
      dl: 'Reporting and interactive analytics.', meta: ['BI'] },
    { logo: lExcel, name: 'Excel', type: 'sheet', cpu: 70, mem: '86 MB', st: 'bg',
      dl: 'Data analysis and quick modelling.', meta: ['Analysis'] },
    { logo: lMatplotlib, name: 'Matplotlib', type: 'viz', cpu: 76, mem: '90 MB', st: 'running',
      dl: 'Plotting and visual analysis in Python.', meta: ['Charts'] },
    { logo: lPlotly, name: 'Plotly', type: 'viz', cpu: 73, mem: '88 MB', st: 'bg',
      dl: 'Interactive visualisation for the hackathon system.', meta: ['Kitchen Opt.'] },
  ]},
  { cat: 'Apps · Orchestration · Deploy', open: false, items: [
    { logo: lPrefect, name: 'Prefect', type: 'orchestrate', cpu: 75, mem: '92 MB', st: 'running',
      dl: 'Orchestrates AI Radar’s daily ingest of 260+ records.', meta: ['AI Radar', 'Pipelines'] },
    { logo: lStreamlit, name: 'Streamlit', type: 'app', cpu: 71, mem: '96 MB', st: 'bg',
      dl: 'Rapid ML app prototyping and demos.', meta: ['Prototype'] },
    { logo: lGradio, name: 'Gradio', type: 'app', cpu: 69, mem: '84 MB', st: 'bg',
      dl: 'Quick interactive ML interfaces.', meta: ['Demo'] },
    { logo: lVercel, name: 'Vercel', type: 'deploy', cpu: 74, mem: '58 MB', st: 'running',
      dl: 'Front-end hosting for AI Radar in production.', meta: ['AI Radar', 'Deploy'] },
    { logo: lRailway, name: 'Railway', type: 'deploy', cpu: 72, mem: '60 MB', st: 'running',
      dl: 'Backend + pipeline hosting for AI Radar.', meta: ['AI Radar', 'Deploy'] },
  ]},
];

const AREAS = [
  { n: 'ML & Deep Learning', v: 88 },
  { n: 'Computer Vision',    v: 84 },
  { n: 'NLP / LLM / RAG',    v: 85 },
  { n: 'Data & SQL',         v: 90 },
  { n: 'Backend & Deploy',   v: 80 },
];

const METRICS = [
  ['Query latency', '−30%'], ['OCR accuracy', '+15%'],
  ['Road mAP@0.5', '87%'],   ['AI Radar Hit@1', '100%'],
  ['Records / day', '260+'], ['SQL pipelines', '800+'],
];

const MSC_MODULES = ['Machine Learning', 'Deep Learning', 'Data Visualisation', 'Modern Data', 'Artificial Intelligence'];

const stLabel = s => (s === 'active' ? 'Active' : s === 'running' ? 'Running' : 'Background');

/* canvas colours resolved from the live theme (robust; no getComputedStyle) */
const paint = theme => theme === 'dark'
  ? { sig: [255, 180, 84], scope: '#0d0f12', grid: 'rgba(255,255,255,0.06)', dim: '#b6bcc4' }
  : { sig: [0, 0, 128],    scope: '#ffffff', grid: 'rgba(0,0,0,0.09)',      dim: '#404040' };

export default function SkillsSection() {
  const theme = useHtmlTheme('dark');           // inherits <html data-theme>
  const os = useOS();
  const winState = os.wins.sysmonitor || { open: true, minimized: false };
  const winCtl = !os.isMobile;                  // window management on desktop only
  const winRef = useRef(null);
  const onTitlebarDown = useWindowDrag(winRef, { enabled: !!winCtl });
  /* Mirrors the live open flag so the [] IntersectionObserver below never
     reads a stale closure. Re-entering the section relaunches a closed
     window — closing ✕ is a dismissal for THIS pass, not forever. */
  const winOpenRef = useRef(false);
  const click = fn => e => { playClick(); if (fn) fn(e); };

  const [tab, setTab]         = useState('proc');
  const [denied, setDenied]   = useState(null);
  const deniedTR = useRef(null);
  useEffect(() => () => clearTimeout(deniedTR.current), []);
  const [open, setOpen]       = useState(() => GROUPS.map(g => g.open));
  const [sortKey, setSortKey] = useState('cpu');
  const [sortDir, setSortDir] = useState(-1);
  const [selRow, setSelRow]   = useState(null);          // "gi:name"
  const [learnIx, setLearnIx] = useState(0);
  const [cpuAgg, setCpuAgg]   = useState('—');

  const rootRef  = useRef(null);
  const cpuRef   = useRef(null);
  const memRef   = useRef(null);
  const isoRef   = useRef(null);
  const inView   = useRef(false);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  /* reveal: IntersectionObserver toggles .sk-in (CSS runs the animation) */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        if (e.isIntersecting) {
          el.classList.add('sk-in');
          if (winCtl && !winOpenRef.current) { os.wAction('sysmonitor', 'open'); }
        }
      },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => { winOpenRef.current = !!os.wins.sysmonitor?.open; }, [os.wins.sysmonitor]);

  /* scroll-scrubbed --sk-p (parallax on the ghost wordmark); ref-written */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      if (!inView.current) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.85)));
      el.style.setProperty('--sk-p', p.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    tick();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  /* learning ticker */
  useEffect(() => {
    const id = setInterval(() => setLearnIx(i => (i + 1) % MSC_MODULES.length), 2200);
    return () => clearInterval(id);
  }, []);

  /* live graphs (CPU history + memory) — only while Performance is open */
  useEffect(() => {
    if (tab !== 'perf') return;
    const cpuC = cpuRef.current, memC = memRef.current;
    if (!cpuC || !memC) return;
    const dpr = window.devicePixelRatio || 1;
    const setup = (c, h) => { const r = c.getBoundingClientRect(); c.width = r.width * dpr; c.height = h * dpr; const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return x; };
    let cpuX = setup(cpuC, 118), memX = setup(memC, 56);
    const cpuH = Array.from({ length: 120 }, () => 26 + Math.random() * 10);
    const memH = Array.from({ length: 120 }, () => 40 + Math.random() * 8);
    let t = 0, raf = 0, alive = true;

    const line = (ctx, hist, w, h) => {
      const { sig, grid } = paint(themeRef.current);
      const rgb = sig.join(',');
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = grid; ctx.lineWidth = 1;
      for (let x = w % 22; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const step = w / (hist.length - 1);
      ctx.beginPath(); ctx.moveTo(0, h); hist.forEach((v, i) => ctx.lineTo(i * step, h - v / 100 * h)); ctx.lineTo(w, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${rgb},0.30)`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); hist.forEach((v, i) => { const x = i * step, y = h - v / 100 * h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = `rgb(${rgb})`; ctx.lineWidth = 1.6; ctx.shadowColor = `rgba(${rgb},0.55)`; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
      const lv = hist[hist.length - 1]; ctx.fillStyle = '#39FF14'; ctx.beginPath(); ctx.arc(w - 1, h - lv / 100 * h, 2.3, 0, 7); ctx.fill();
      return lv;
    };
    let frame = 0, lastAgg = '';
    const loop = () => {
      if (!alive) return;
      // Fully idle while the section is scrolled away — the IO below flips
      // inView; we keep a light heartbeat instead of drawing blind.
      if (!inView.current) { raf = requestAnimationFrame(loop); return; }
      frame++;
      if (frame % 3 === 0) {   // ~20 samples/s: telemetry, not noise
        t += 0.18;
        cpuH.push(Math.max(10, Math.min(94, 52 + Math.sin(t) * 14 + Math.sin(t * 2.3) * 8 + Math.random() * 12))); cpuH.shift();
        memH.push(Math.max(30, Math.min(78, 52 + Math.sin(t * 0.6) * 10 + Math.random() * 6))); memH.shift();
      }
      const w = cpuX.canvas.width / dpr;
      const lv = line(cpuX, cpuH, w, 118);
      line(memX, memH, memX.canvas.width / dpr, 56);
      const agg = Math.round(lv) + '%';
      if (agg !== lastAgg) { lastAgg = agg; setCpuAgg(agg); }  // state only on change
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => { cpuX = setup(cpuC, 118); memX = setup(memC, 56); };
    window.addEventListener('resize', onResize);
    loop();
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [tab]);

  /* 3D isometric competency bars — one-shot grow on open + theme redraw */
  const drawIso = useCallback((progress) => {
    const c = isoRef.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect(); c.width = r.width * dpr; c.height = 224 * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = r.width, h = 224, { sig, scope, grid, dim } = paint(themeRef.current);
    const shade = f => 'rgb(' + sig.map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))).join(',') + ')';
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    for (let y = h - 30; y > 20; y -= 20) { ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(w - 16, y); ctx.stroke(); }
    const n = AREAS.length, slot = (w - 40) / n, bw = Math.min(30, slot - 14), dx = 11, dy = -7, baseY = h - 34, maxH = 126;
    AREAS.forEach((a, i) => {
      const x = 24 + i * slot + (slot - bw) / 2 - dx / 2, H = (a.v / 100) * maxH * progress, top = baseY - H, cx = x + bw / 2 + dx / 2;
      ctx.fillStyle = shade(-0.34); ctx.beginPath(); ctx.moveTo(x + bw, top); ctx.lineTo(x + bw + dx, top + dy); ctx.lineTo(x + bw + dx, baseY + dy); ctx.lineTo(x + bw, baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(0.34);  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + bw, top); ctx.lineTo(x + bw + dx, top + dy); ctx.lineTo(x + dx, top + dy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgb(' + sig.join(',') + ')'; ctx.fillRect(x, top, bw, H);
      ctx.strokeStyle = scope; ctx.globalAlpha = 0.5;
      for (let sy = top + 6; sy < baseY; sy += 7) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + bw, sy); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgb(' + sig.join(',') + ')'; ctx.font = '700 11px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(a.v * progress) + '%', cx, top + dy - 4);
      ctx.fillStyle = dim; ctx.font = '11px "IBM Plex Sans",sans-serif';
      const wds = a.n.split(' ');
      if (wds.length > 2) { ctx.fillText(wds.slice(0, 2).join(' '), cx, h - 18); ctx.fillText(wds.slice(2).join(' '), cx, h - 8); }
      else ctx.fillText(a.n, cx, h - 12);
    });
  }, []);

  useEffect(() => {
    if (tab !== 'perf') return;
    let raf = 0, start = null;
    const step = ts => { if (start === null) start = ts; const k = Math.min(1, (ts - start) / 850); drawIso(1 - Math.pow(1 - k, 3)); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    const onResize = () => drawIso(1);
    window.addEventListener('resize', onResize);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [tab, drawIso]);

  useEffect(() => { if (tab === 'perf') drawIso(1); }, [theme, tab, drawIso]);

  /* handlers */

  const toggleGroup = gi => { playClick(); setOpen(o => o.map((v, i) => (i === gi ? !v : v))); };
  const clickSort = k => {
    playClick();
    if (sortKey === k) setSortDir(d => -d);
    else { setSortKey(k); setSortDir(k === 'cpu' ? -1 : 1); }
  };
  /* Enter/Space activation for the div/span elements below that carry click
     handlers but aren't real buttons — keeps their existing layout/CSS
     untouched while making them keyboard-operable. */
  const keyActivate = fn => e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };
  const sortItems = items => [...items].sort((a, b) => {
    if (sortKey === 'cpu') return (a.cpu - b.cpu) * sortDir;
    if (sortKey === 'mem') return (parseInt(a.mem, 10) - parseInt(b.mem, 10)) * sortDir;
    return String(a.name).localeCompare(String(b.name)) * sortDir;
  });

  const totalProc = GROUPS.reduce((s, g) => s + g.items.length, 0);
  const caret = k => (sortKey === k ? (sortDir < 0 ? ' ▼' : ' ▲') : '');
  const goProjects = () => { playClick(); const t = document.getElementById('projects'); if (t) t.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <section id="skills" className="sk-section" ref={rootRef}>
      {/* hero wordmark tail, dissolving — continuity from the desktop above */}
      {/* <div className="sk-ghost" aria-hidden="true">SHREY PATEL</div> */}

      <header className="sk-break">
        <span className="sk-idx">03</span>
        <span className="sk-title">Skills</span>
        <span className="sk-sub">// system_monitor.exe — running</span>
        <span className="sk-rule" />
      </header>

      <div className="sk-win" ref={winRef}
        style={winCtl && (!winState.open || winState.minimized) ? { display: 'none' } : undefined}>
        <div className="sk-crt" aria-hidden="true" />

        <div className="sk-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
          <span className="tb-live-dot" />
          <svg className="sk-tico" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1" y="2" width="14" height="10" rx="1" fill="#0d0f12" stroke="#cfd6dd" strokeWidth="1" />
            <rect x="5" y="13" width="6" height="1.4" fill="#cfd6dd" />
            <polyline points="2.5,9 4.5,9 5.8,5.5 7.3,10.5 8.8,7 10,9 13.5,9" fill="none" stroke="#ffb454" strokeWidth="1" />
          </svg>
          <span className="sk-titletxt">System Monitor</span>
          <div className="sk-winbtns">
            <button className="win-btn" aria-label="Minimize System Monitor"
              onClick={() => { if (!winCtl) return; playClick(); os.wAction('sysmonitor', 'minimize'); }}>_</button>
            <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
            <button className="win-btn win-close" aria-label="Close System Monitor"
              onClick={() => { if (!winCtl) return; playClick(); os.wAction('sysmonitor', 'close'); }}>✕</button>
          </div>
        </div>

        <div className="sk-menubar">
          <span>File</span><span>Options</span><span>View</span><span>Help</span>
          <span className="sk-menu-spacer" />
          <span className="sk-rate"><span className="sk-rate-dot" />Update speed: High</span>
        </div>

        <div className="sk-tabs" role="tablist">
          {[['proc', 'Processes'], ['perf', 'Performance']].map(([id, lbl]) => (
            <button key={id} role="tab" aria-selected={tab === id}
              className={`sk-tab${tab === id ? ' sk-tab-active' : ''}`} onClick={() => { playClick(); setTab(id); }}>{lbl}</button>
          ))}
        </div>

        <div className="sk-body">
          {tab === 'proc' && (
            <div className="sk-tab-panel">
              <div className="sk-proc-head">
                <span role="button" tabIndex={0} aria-label={`Sort by name${caret('name')}`}
                  onClick={() => clickSort('name')} onKeyDown={keyActivate(() => clickSort('name'))}>
                  Image Name{caret('name')}</span>
                <span className="sk-c-type sk-col-static">Type</span>
                <span className="sk-c-num" role="button" tabIndex={0} aria-label={`Sort by CPU${caret('cpu')}`}
                  onClick={() => clickSort('cpu')} onKeyDown={keyActivate(() => clickSort('cpu'))}>
                  CPU{caret('cpu')}</span>
                <span className="sk-c-num sk-c-mem" role="button" tabIndex={0} aria-label={`Sort by memory${caret('mem')}`}
                  onClick={() => clickSort('mem')} onKeyDown={keyActivate(() => clickSort('mem'))}>
                  Mem{caret('mem')}</span>
                <span className="sk-col-static">Status</span>
              </div>
              <div className="sk-scroll">
                {GROUPS.map((g, gi) => (
                  <div key={g.cat}>
                    <div className="sk-grp" role="button" tabIndex={0} aria-expanded={open[gi]}
                      onClick={() => toggleGroup(gi)} onKeyDown={keyActivate(() => toggleGroup(gi))}>
                      <span className="sk-tw">{open[gi] ? '▼' : '►'}</span>{g.cat}
                      <span className="sk-cnt">{g.items.length} processes</span>
                    </div>
                    {open[gi] && sortItems(g.items).map(it => {
                      const key = gi + ':' + it.name;
                      const isSel = selRow === key;
                      const selectRow = () => { playClick(); setSelRow(isSel ? null : key); };
                      return (
                        <div key={key}>
                          <div className={`sk-row${isSel ? ' sk-sel' : ''}`} role="button" tabIndex={0} aria-expanded={isSel}
                            onClick={selectRow} onKeyDown={keyActivate(selectRow)}>
                            <div className="sk-nm">
                              <span className="sk-ico"><img src={it.logo} alt="" loading="lazy" /></span>
                              <span className="sk-nm-txt">{it.name}</span>
                            </div>
                            <div className="sk-c-type sk-ty">{it.type}</div>
                            <div className="sk-c-num sk-cpu">
                              <span className="sk-mini"><i style={{ width: it.cpu + '%' }} /></span>
                              <span className="sk-pc">{it.cpu}%</span>
                            </div>
                            <div className="sk-c-num sk-c-mem sk-mem">{it.mem}</div>
                            <div className={`sk-st sk-st-${it.st}`}><span className="sk-sd" />{stLabel(it.st)}</div>
                          </div>
                          {isSel && (
                            <div className="sk-drawer">
                              <div className="sk-dl">{it.dl}</div>
                              <div className="sk-meta">
                                {it.meta.map(m => <span key={m} className="sk-chip">{m}</span>)}
                                <span className="sk-meta-sp" />
                                <button className="sk-endtask"
                                  onClick={e => { e.stopPropagation(); playClick(); setDenied(it.name);
                                    clearTimeout(deniedTR.current);
                                    deniedTR.current = setTimeout(() => setDenied(null), 3200); }}>
                                  End Task
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'perf' && (
            <div className="sk-tab-panel sk-perf">
              <div className="sk-panel">
                <h4><span className="sk-ld" />CPU usage history · neural activity</h4>
                <div className="sk-scope"><canvas ref={cpuRef} /></div>
                <div className="sk-scope sk-scope-mem"><canvas ref={memRef} /></div>
                <div className="sk-metrics">
                  {METRICS.map(([k, v]) => (
                    <div key={k} className="sk-mrow"><span className="sk-k">{k}</span><span className="sk-v">{v}</span></div>
                  ))}
                </div>
                <div className="sk-learn">threads (MSc @ Brunel): <b>{MSC_MODULES[learnIx]}</b><span className="sk-cur">▋</span></div>
              </div>
              <div className="sk-panel">
                <h4>Core load · competency areas</h4>
                <div className="sk-iso"><canvas ref={isoRef} /></div>
              </div>
            </div>
          )}
        </div>

        <div className="sk-statusbar">
          <span className="sk-sb">Processes: <b>{totalProc}</b></span>
          <span className="sk-sb">CPU Usage: <b>{tab === 'perf' ? cpuAgg : '—'}</b></span>
          <span className="sk-sb sk-sb-grow" />
          <span className={`sk-sb${denied ? ' sk-sb-denied' : ''}`}>{denied
            ? <>Access denied — <b>{denied}</b> is load-bearing.</>
            : <>Skill load: <b>nominal</b></>}</span>
        </div>
      </div>

      {winCtl && !winState.open && (
        <button className="sec-relaunch"
          onClick={() => { playClick(); os.wAction('sysmonitor', 'open'); }}>
          system_monitor.exe — relaunch ▸
        </button>
      )}

      <button className="sk-next" onClick={goProjects}>
        <span>04 · Projects</span><span className="sk-next-arw">▼</span>
      </button>
    </section>
  );
}