/* ══════════════════════════════════════════════════════════════════════════
   ProjectsSection.jsx — "Disk Archive"  (SHREY/OS · section 04)
   ---------------------------------------------------------------------------
   Order: Hero (01) → About (02) → Skills (03) → Projects (04).

   FLOW
     click a floppy → disk slides into DRIVE A: → MS-DOS Prompt window boots
     from A: (typed `cd`, POST lines, progress bar) → terminal dissolves →
     the project window grows out of the drive slot → registers on the taskbar.

   THEME
     Never sets data-theme — OSContext writes it on <html>, so [data-theme]
     in global.css cascades. Accent is --pj-sig, mirroring --sk-sig / --ab-sig
     (navy #000080 in light · amber #ffb454 in dark).

   HEIGHT
     Static (no sticky scroll track). HeroSection measures its progress against
     document.documentElement.scrollHeight, so a tall track here would starve
     the hero of the progress it needs for stage 3. Keeping this section its
     natural height sidesteps that entirely. (DIFF 1 in DIFFS.txt fixes the
     root cause; this section is safe either way.)

   WINDOWS
     Each project gets its own OSContext window id: proj_airadar, proj_contract,
     proj_road, proj_kitchen — so drag / minimize / close / taskbar all work per
     project, exactly like sysmonitor and about.
   ═════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOS, playClick, playWindowOpen } from './OSContext';

/* Safe JSX bold-splitter for static strings containing only <b>…</b> spans —
   replaces dangerouslySetInnerHTML. */
const renderB = (html) => String(html).split(/<b>|<\/b>/g).map((part, i) =>
  i % 2 ? <b key={i}>{part}</b> : (part ? <span key={i}>{part}</span> : null));
import { PxExternalLink, PxGitBranch } from './PixelIcons.jsx';
import { OsHardDisk, OsMaps, OsText, OsImageViewer, OsCertificate } from './OsIcons.jsx';
import { LINKS } from './projectLinks.js';

/* Program Manager titlebar identity per feed kind */
const FEED_ICON = { radar: OsMaps, docscan: OsText, vision: OsImageViewer, forecast: OsCertificate };

/* ── every field below is sourced from the CV — nothing invented ────────── */

const PROJECTS = [
  {
    id: 'airadar',
    feed: 'radar',
    win: 'proj_airadar',
    /* TODO(shrey): set the live Vercel URL + repo — the Launch / View Source
       buttons in ProjectWindow render as soon as these are non-null. */
    url:  LINKS.airadar.url,
    repo: LINKS.airadar.repo,
    vol: 'AI_RADAR',
    name: 'AI RADAR',
    tech: ['Next.js · FastAPI', 'pgvector · Groq'],
    date: 'MAY–JUN 2026',
    title: 'AI Radar — AI Intelligence Briefing Platform',
    sub: 'AI Intelligence Briefing Platform',
    post: [
      '> Reading A:\\ — 3.5" HD ...............  OK',
      '> Detecting AI_RADAR ........  260 records OK',
      '> Mounting pgvector store ...............  OK',
      '> Groq · Jina AI · Prefect ..............  OK',
    ],
    chips: ['Next.js', 'FastAPI', 'PostgreSQL/pgvector', 'Groq', 'Jina AI', 'Prefect', 'Supabase'],
    overview: [
      'Keeping up with the fast-moving AI landscape manually takes hours every day, so I built an automated pipeline that scrapes, summarises and stores <b>260+ records</b> across AI papers, news, tools and benchmarks every day without any manual effort.',
      'Deployed as a production-grade full-stack application across Vercel, Railway and Supabase.',
    ],
    arch: [
      ['Retrieval', 'Hybrid RAG — semantic vector search combined with keyword matching using <b>Reciprocal Rank Fusion</b>'],
      ['Routing',   'Confidence-gated fallback that automatically corrects wrong section routing'],
      ['Pipeline',  'Prefect orchestration — scheduled daily ingest'],
      ['Store',     'PostgreSQL + pgvector on Supabase'],
      ['Eval',      'Built-in <b>LLM-as-judge</b> framework grading summary quality on every pipeline run'],
      ['Deploy',    'Vercel · Railway · Supabase'],
    ],
    mets: [
      ['Records / day', '260+'],
      ['Hit@1 (specific queries)', '100%'],
      ['Deploy targets', '3'],
      ['Quality grading', 'per run'],
    ],
  },
  {
    id: 'contract',
    feed: 'docscan',
    win: 'proj_contract',
    url:  LINKS.contract.url,
    repo: LINKS.contract.repo,
    vol: 'CONTRACTS',
    name: 'CONTRACT TRACKER',
    tech: ['LangChain · ChromaDB', 'DeepSeek V3 · React'],
    date: '2026',
    title: 'Multi-Contract Obligation Tracker',
    sub: 'RAG over legal contracts',
    post: [
      '> Reading A:\\ — 3.5" HD ...............  OK',
      '> Detecting CONTRACTS ..................  OK',
      '> Mounting ChromaDB vector store .......  OK',
      '> LangChain · DeepSeek V3 ..............  OK',
    ],
    chips: ['LangChain', 'ChromaDB', 'DeepSeek V3', 'FastAPI', 'React', 'Vite'],
    overview: [
      'Obligations buried across multiple contracts are easy to miss — and expensive to miss. This tracks them by making a corpus of contracts <b>queryable in natural language</b>.',
      'A retrieval layer over a vector store, wired to a chat surface — so the question gets asked in English rather than in ctrl-F.',
    ],
    arch: [
      ['Retrieval', 'LangChain orchestration over a <b>ChromaDB</b> vector store'],
      ['Model',     'DeepSeek V3 for extraction and answer synthesis'],
      ['API',       'FastAPI service layer'],
      ['Client',    'React + Vite front end'],
    ],
    mets: [
      ['Scope', 'multi-document'],
      ['Interface', 'natural language'],
      ['Pattern', 'RAG'],
    ],
  },
  {
    id: 'road',
    feed: 'vision',
    win: 'proj_road',
    url:  LINKS.road.url,
    repo: LINKS.road.repo,
    vol: 'ROAD_DMG',
    name: 'ROAD DAMAGE',
    tech: ['YOLOv5 · PyTorch', 'OpenCV · Pandas'],
    date: 'MAR–APR 2024',
    title: 'Road Damage Detection',
    sub: 'YOLOv5 object detection',
    post: [
      '> Reading A:\\ — 3.5" HD ...............  OK',
      '> Detecting ROAD_DMG ...................  OK',
      '> Loading YOLOv5 weights ...............  OK',
      '> PyTorch · OpenCV .....................  OK',
    ],
    chips: ['YOLOv5', 'PyTorch', 'OpenCV', 'Pandas'],
    overview: [
      'Designed and trained a <b>YOLOv5</b> object detection model in PyTorch, refining loss functions and training loops to improve performance on road damage datasets.',
      'Applied data augmentation — rotation, scaling and brightness adjustment — to make the model more robust across varying road conditions.',
    ],
    arch: [
      ['Model',        'YOLOv5 in PyTorch — refined loss functions and training loops'],
      ['Augmentation', 'Rotation · scaling · brightness adjustment'],
      ['Evaluation',   'IoU and <b>mAP@0.5</b>'],
      ['Tooling',      'OpenCV · Pandas'],
    ],
    mets: [
      ['Test accuracy', '87%'],
      ['Metric', 'mAP@0.5'],
      ['Framework', 'PyTorch'],
    ],
  },
  {
    id: 'kitchen',
    feed: 'forecast',
    win: 'proj_kitchen',
    url:  LINKS.kitchen.url,
    repo: LINKS.kitchen.repo,
    vol: 'KITCHEN',
    name: 'KITCHEN OPTIMIZATION',
    badge: '1ST PLACE',
    tech: ['YOLOv8 · LLaMA', 'XGBoost · Prophet'],
    date: 'MAR 2025',
    title: 'AI-Powered Kitchen Optimization System',
    sub: 'Hackathon — 1st place',
    post: [
      '> Reading A:\\ — 3.5" HD ...............  OK',
      '> Detecting KITCHEN ....................  OK',
      '> Loading YOLOv8 · XGBoost · Prophet ...  OK',
      '> LLaMA via Groq API ...................  OK',
    ],
    chips: ['YOLOv8', 'LLaMA', 'XGBoost', 'Prophet', 'Plotly', 'Groq'],
    overview: [
      '<b>Won 1st place</b> in a company hackathon — I led the team, designing and delivering an AI system for inventory optimisation, demand forecasting, waste reduction and recipe generation.',
      'Integrated LLaMA via the Groq API for recipe generation, applying prompt engineering to produce cooking instructions directly from ingredient lists.',
    ],
    arch: [
      ['Vision',     'YOLOv8 for inventory recognition'],
      ['Forecasting','XGBoost + Prophet for demand prediction'],
      ['Generation', 'LLaMA via Groq API — recipes from ingredient lists'],
      ['Refinement', 'Few-shot learning for consistent recipe format and nutritional guidelines'],
      ['Viz',        'Plotly'],
    ],
    mets: [
      ['Result', '1st place'],
      ['Role', 'team lead'],
      ['Domains', '4'],
    ],
  },
];


/* ── Run log entries: structured output records, not raw terminal text ── */
const RUN_LOGS = {
  airadar: [
    { t: 'INIT',    m: 'Pipeline scheduler started — Prefect Cloud' },
    { t: 'INGEST',  m: '260+ records scraped across AI paper · news · tools feeds' },
    { t: 'EMBED',   m: 'Jina AI embeddings generated — dense + sparse vectors' },
    { t: 'STORE',   m: 'pgvector upsert → Supabase PostgreSQL' },
    { t: 'EVAL',    m: 'LLM-as-judge quality check — all summaries passed' },
    { t: 'SERVE',   m: 'Groq LLaMA inference ready — Hit@1 100%' },
    { t: 'DEPLOY',  m: 'Vercel (front-end) · Railway (API) — healthy' },
    { t: 'OK',      m: 'Daily pipeline complete', ok: true },
  ],
  contract: [
    { t: 'INIT',    m: 'LangChain orchestrator loaded' },
    { t: 'LOAD',    m: 'Contract corpus ingested — multi-document chunking' },
    { t: 'EMBED',   m: 'ChromaDB vector store populated' },
    { t: 'MODEL',   m: 'DeepSeek V3 loaded — obligation extraction ready' },
    { t: 'API',     m: 'FastAPI service layer running' },
    { t: 'CLIENT',  m: 'React + Vite front-end served' },
    { t: 'OK',      m: 'Contract tracker operational', ok: true },
  ],
  road: [
    { t: 'INIT',    m: 'YOLOv5 weights loaded — PyTorch backend' },
    { t: 'DATA',    m: 'Road damage dataset prepared — 4 damage classes' },
    { t: 'AUG',     m: 'Augmentation pipeline applied: rotation · scale · brightness' },
    { t: 'TRAIN',   m: 'Fine-tune run complete — loss converged' },
    { t: 'EVAL',    m: 'Validation set — mAP@0.5 = 0.87' },
    { t: 'OK',      m: 'Model training complete — 87% accuracy', ok: true },
  ],
  kitchen: [
    { t: 'INIT',    m: 'Hackathon environment initialised — team lead: Shrey' },
    { t: 'VISION',  m: 'YOLOv8 inventory recognition — kitchen items detected' },
    { t: 'FORECAST',m: 'XGBoost + Prophet demand model trained' },
    { t: 'GEN',     m: 'LLaMA via Groq — recipe generation from ingredient lists' },
    { t: 'REFINE',  m: 'Few-shot prompting applied — consistent format + nutrition' },
    { t: 'VIZ',     m: 'Plotly dashboard rendered — real-time insights' },
    { t: 'RESULT',  m: '1ST PLACE — hackathon winner', ok: true },
  ],
};

const TABS = ['Overview', 'Architecture', 'Metrics', 'Run Log'];

/* ══════════════════════════════════════════════════════════════════════════
   BOOT TERMINAL — a real Win95 MS-DOS Prompt window over a blurred page
  ══════════════════════════════════════════════════════════════════════════ */
function BootTerminal({ project, onDone, reduced }) {
  const [typed, setTyped]   = useState('');
  const [lines, setLines]   = useState([]);
  const [bar, setBar]       = useState(-1);      // -1 hidden, 0..14 filling
  const [ready, setReady]   = useState(false);
  const [stat, setStat]     = useState('Reading boot sector…');
  const timers = useRef([]);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    timers.current.forEach(clearTimeout);
    onDone();
  }, [onDone]);

  useEffect(() => {
    const cmd = `cd ./projects/${project.id}`;
    const T = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

    if (reduced) { finish(); return; }

    /* ~3.2s total — slow enough to read every line, fast enough that nobody
       reaches for the SKIP button. Tuned from 1.4s (too quick to notice) and
       4.9s (a toll booth). */
    let t = 260;
    /* 1 — type the command, 42ms/char */
    [...cmd].forEach((ch, i) => T(() => setTyped(cmd.slice(0, i + 1)), t + i * 42));
    t += cmd.length * 42 + 340;

    /* 2 — POST lines, one every 210ms */
    T(() => setStat('POST — checking devices…'), t);
    project.post.forEach((ln, i) => {
      T(() => setLines(p => [...p, ln]), t + i * 210);
    });
    t += project.post.length * 210 + 140;

    /* 3 — module load bar */
    T(() => setBar(0), t);
    for (let i = 1; i <= 14; i++) T(() => setBar(i), t + i * 30);
    t += 14 * 30 + 220;

    /* 4 — ready, then hand off */
    T(() => { setReady(true); setStat('Launching…'); }, t);
    t += 480;
    T(finish, t);

    return () => timers.current.forEach(clearTimeout);
  }, [project, reduced, finish]);

  /* Portalled to <body>: #root and .site-bg get blurred while booting, and a
     child cannot escape its parent's filter. Rendering outside #root is the
     only way the terminal stays sharp over a blurred desktop. */
  return createPortal(
    <div className="pj-scrim" onClick={finish}>
      <div className="pj-term" onClick={e => e.stopPropagation()}>
        <div className="pj-term-tb">
          <span className="pj-term-ico">A:</span>
          <span className="pj-term-t">MS-DOS Prompt — A:\PROJECTS\{project.vol}</span>
          <div className="pj-term-btns">
            <button className="win-btn" tabIndex={-1}>_</button>
            <button className="win-btn" tabIndex={-1}>□</button>
            <button className="win-btn win-close" onClick={finish} aria-label="Skip boot">✕</button>
          </div>
        </div>

        <div className="pj-term-mb">
          <span>File</span><span>Edit</span><span>View</span><span>Terminal</span><span>Help</span>
          <span className="pj-term-sp" />
          <button className="pj-skip" onClick={finish}>SKIP ▸</button>
        </div>

        <div className="pj-term-body">
          <div className="pj-term-bd">
            <div className="pj-ln">
              <span className="pj-dim">A:\&gt;</span> {typed}
              {!lines.length && <span className="pj-caret" />}
            </div>
            {lines.map((l, i) => <div className="pj-ln" key={i}>{l}</div>)}
            {bar >= 0 && (
              <div className="pj-ln">
                {'> Loading project modules ['}
                <span className="pj-bar">{'█'.repeat(bar)}{'░'.repeat(14 - bar)}</span>
                {'] '}{Math.round((bar / 14) * 100)}%
              </div>
            )}
            {ready && (
              <div className="pj-ln">
                <b>&gt; READY. Launching {project.vol}...</b><span className="pj-caret" />
              </div>
            )}
          </div>
        </div>

        <div className="pj-term-sb">
          <span className="pj-term-c">Drive <b>A:</b></span>
          <span className="pj-term-c pj-term-grow">{stat}</span>
          <span className="pj-term-c">3.5" HD</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PROJECT WINDOW — Overview / Architecture / Metrics
  ══════════════════════════════════════════════════════════════════════════ */
function ProjectWindow({ p, originPct, onEject, winCtl, state }) {
  const os = useOS();
  const [tab, setTab] = useState(0);
  const winRef = useRef(null);
  const dragRef = useRef({ tx: 0, ty: 0 });

  /* drag — clamp math mirrors SkillsSection.onTitlebarDown exactly */
  const onTitlebarDown = useCallback(e => {
    if (!winCtl || (e.target.closest && e.target.closest('.win-btn'))) return;
    const el = winRef.current; if (!el) return;
    const st = dragRef.current;
    const rect = el.getBoundingClientRect();
    const homeLeft = rect.left - st.tx, homeTop = rect.top - st.ty, w = rect.width;
    const sx = e.clientX, sy = e.clientY, tx0 = st.tx, ty0 = st.ty;
    const onMove = ev => {
      let dtx = tx0 + (ev.clientX - sx), dty = ty0 + (ev.clientY - sy);
      dtx = Math.max(-(w - 80) - homeLeft, Math.min((window.innerWidth - 80) - homeLeft, dtx));
      dty = Math.max(-homeTop, Math.min((window.innerHeight - 54) - homeTop, dty));
      dragRef.current = { tx: dtx, ty: dty };
      el.style.transform = `translate(${dtx}px, ${dty}px)`;
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }, [winCtl]);

  if (winCtl && (!state.open || state.minimized)) return null;

  return (
    <div className="pj-win" ref={winRef} style={{ '--pj-ox': originPct }}>
      <div className="pj-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
        <span className="tb-live-dot" />
        <OsHardDisk className="pj-tico" size={16} />
        <span className="pj-titletxt">{p.title}</span>
        <div className="pj-winbtns">
          <button className="win-btn" aria-label={`Minimize ${p.name}`}
            onClick={() => { playClick(); os.wAction('explorer', 'minimize'); }}>_</button>
          <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
          <button className="win-btn win-close" aria-label={`Close ${p.name}`}
            onClick={onEject}>✕</button>
        </div>
      </div>

      <div className="pj-menubar">
        <span>File</span><span>Edit</span><span>View</span><span>Help</span>
        <span className="pj-menu-spacer" />
        {p.url
          ? <a className="pj-menu-launch" href={p.url} target="_blank" rel="noopener noreferrer"
              onClick={() => playClick()}>
              <PxExternalLink size={24} /> Launch
            </a>
          : <span className="pj-menu-launch pj-menu-launch-disabled"
              title="Not public yet — see Architecture for the build">
              <PxExternalLink size={24} /> Launch
            </span>
        }
        {p.repo && (
          <a className="pj-menu-launch" href={p.repo} target="_blank" rel="noopener noreferrer"
            onClick={() => playClick()}>
            <PxGitBranch size={24} /> Source
          </a>
        )}
        <span className="pj-rate"><span className="pj-rate-dot" />Vol: {p.vol}</span>
      </div>

      <div className="pj-tabs" role="tablist">
        {TABS.map((t, i) => (
          <button key={t} role="tab" aria-selected={i === tab}
            className={`pj-tab${i === tab ? ' pj-tab-active' : ''}`}
            onClick={() => { playClick(); setTab(i); }}>
            {t}
          </button>
        ))}
      </div>

      <div className="pj-body">
        <div className="pj-field">
          <div className="pj-page" key={tab}>
            <div className="pj-page-head">
              <span className="pj-ph">{TABS[tab]}</span>
              <span className="pj-ph-spacer" />
              <span className="pj-ph-meta">{p.vol} · {p.date}</span>
            </div>

            <div className="pj-scroll">
              {tab === 0 && (
                <div className="pj-tab-panel" key={`0-${p.id}`}>
                  <div className="pj-grp">
                    <span className="pj-tw">▼</span>Summary
                    <span className="pj-cnt">{p.sub}</span>
                  </div>
                  <div className="pj-prose">
                    {p.overview.map((t, i) => (
                      <p key={i}>{renderB(t)}</p>
                    ))}
                  </div>
                  {p.arch?.[0] && (
                    <div className="pw-signature">
                      <span className="pw-signature-label">{p.arch[0][0]}</span>
                      {renderB(p.arch[0][1])}
                    </div>
                  )}
                  <div className="pj-grp">
                    <span className="pj-tw">▼</span>Stack
                    <span className="pj-cnt">{p.chips.length} technologies</span>
                  </div>
                  <div className="pj-chips">
                    {p.chips.map(c => <span className="pj-chip" key={c}>{c}</span>)}
                  </div>
                </div>
              )}

              {tab === 1 && (
                <div className="pj-tab-panel" key={`1-${p.id}`}>
                  <div className="pj-grp">
                    <span className="pj-tw">▼</span>Architecture
                    <span className="pj-cnt">{p.arch.length} components</span>
                  </div>
                  <div className="pj-rows">
                    {p.arch.map(([k, v]) => (
                      <div className="pj-row" key={k}>
                        <span className="pj-k">{k}</span>
                        <span className="pj-v">{renderB(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 2 && (
                <div className="pj-tab-panel" key={`2-${p.id}`}>
                  <div className="pj-grp">
                    <span className="pj-tw">▼</span>Measured output
                    <span className="pj-cnt">{p.mets.length} metrics</span>
                  </div>
                  <div className="pj-metrics">
                    {p.mets.map(([k, v]) => (
                      <div className="pj-metric" key={k}>
                        <span className="pj-mk">{k}</span>
                        <span className="pj-mv">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 3 && (
                <div className="pj-tab-panel" key={`3-${p.id}`}>
                  <div className="pj-grp">
                    <span className="pj-tw">▼</span>Run Log
                    <span className="pj-cnt">A:\PROJECTS\{p.vol}</span>
                  </div>
                  <div className="pj-runlog">
                    {(RUN_LOGS[p.id] || []).map((entry, i) => (
                      <div key={i} className={`pj-log-row${entry.ok ? ' pj-log-ok' : ''}`}>
                        <span className="pj-log-t">[{entry.t}]</span>
                        <span className="pj-log-m">{entry.m}</span>
                        {entry.ok && <span className="pj-log-check">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="pj-grp" style={{marginTop:'12px'}}>
                    <span className="pj-tw">▼</span>Tech Stack
                    <span className="pj-cnt">{p.chips.length} modules loaded</span>
                  </div>
                  <div className="pj-chips">
                    {p.chips.map(c => <span className="pj-chip" key={c}>{c}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pj-statusbar">
        <span className="pj-sb">Vol: <b>{p.vol}</b></span>
        <span className="pj-sb pj-sb-grow">{p.sub}</span>
        <span className="pj-sb">{p.date}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION
  ══════════════════════════════════════════════════════════════════════════ */
export default function ProjectsSection() {
  const os = useOS();
  const winCtl = !os.isMobile;

  const rootRef  = useRef(null);
  const slotRef  = useRef(null);
  const stageRef = useRef(null);

  const [booting, setBooting] = useState(null);   // project mid-boot
  const [mounted, setMounted] = useState(null);   // project id in the drive
  const [reading, setReading] = useState(false);
  const [origin,  setOrigin]  = useState('14%');

  /* reveal on scroll into view */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('pj-in'); },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* listen for archive-boot glow (triggered by folder btn / desktop icon) */
  useEffect(() => {
    const handler = () => {
      const cab = rootRef.current?.querySelector('.pj-caddy');
      if (!cab) return;
      cab.classList.add('pj-caddy-flash');
      setTimeout(() => cab.classList.remove('pj-caddy-flash'), 1800);
    };
    window.addEventListener('shreyos-archive-boot', handler);
    return () => window.removeEventListener('shreyos-archive-boot', handler);
  }, []);

  /* listen for floating window close → auto-eject Drive A */
  useEffect(() => {
    const handler = () => {
      setMounted(null);
      setReading(false);
    };
    window.addEventListener('shreyos-eject-disk', handler);
    return () => window.removeEventListener('shreyos-eject-disk', handler);
  }, []);

  /* blur the page while the terminal is up */
  useEffect(() => {
    document.body.classList.toggle('pj-booting', !!booting);
    return () => document.body.classList.remove('pj-booting');
  }, [booting]);

  const current = PROJECTS.find(p => p.id === mounted) || null;

  /* ── FEED PREVIEWS ─────────────────────────────────────────────────────────
     The monitor wall replaces the floppy shelf. Each screen plays a looping,
     project-specific scene built from CSS animations + tiny SVG — the preview
     IS the pitch: a radar sweeps, a contract scans, detections lock, a
     forecast climbs. Hover accelerates the scene via --spd. */
  const FeedPreview = ({ kind }) => {
    if (kind === 'radar') return (
      <span className="pj-feed pj-feed-radar" aria-hidden="true">
        <span className="pj-fr-scope">
          <span className="pj-fr-rings" />
          <span className="pj-fr-sweep" />
          <span className="pj-fr-blip pj-fr-b1" />
          <span className="pj-fr-blip pj-fr-b2" />
          <span className="pj-fr-blip pj-fr-b3" />
        </span>
        <span className="pj-feed-tag">TRACKING · 260+/day</span>
      </span>
    );
    if (kind === 'docscan') return (
      <span className="pj-feed pj-feed-doc" aria-hidden="true">
        <span className="pj-fd-stage">
          <span className="pj-fd-page">
            {Array.from({ length: 7 }).map((_, i) => <span key={i} className="pj-fd-line" />)}
            <span className="pj-fd-clause" />
          </span>
          <span className="pj-fd-scan" />
        </span>
        <span className="pj-feed-tag">CLAUSE FOUND · §4.2</span>
      </span>
    );
    if (kind === 'vision') return (
      <span className="pj-feed pj-feed-vision" aria-hidden="true">
        <span className="pj-fv-road" />
        <span className="pj-fv-dash" />
        <span className="pj-fv-box pj-fv-box1"><i>crack 0.91</i></span>
        <span className="pj-fv-box pj-fv-box2"><i>pothole 0.87</i></span>
        <span className="pj-feed-tag">DETECTING · mAP 87%</span>
      </span>
    );
    return (
      <span className="pj-feed pj-feed-forecast" aria-hidden="true">
        <span className="pj-ff-bars">
          {[38, 62, 47, 78, 58, 92].map((h, i) => (
            <span key={i} className="pj-ff-bar" style={{ '--h': h + '%', '--d': (i * 0.18) + 's' }} />
          ))}
        </span>
        <span className="pj-ff-trend" />
        <span className="pj-feed-tag">FORECASTING · 1ST PLACE</span>
      </span>
    );
  };

  const measureOrigin = () => {
    const s = slotRef.current, st = stageRef.current;
    if (!s || !st) return '14%';
    const sr = s.getBoundingClientRect(), pr = st.getBoundingClientRect();
    if (!pr.width) return '14%';
    return (((sr.left + sr.width / 2 - pr.left) / pr.width) * 100).toFixed(1) + '%';
  };

  const launch = useCallback(p => {
    setBooting(null);
    setReading(false);
    setMounted(p.id);
    // Broadcast the mounted project (kept for any external listeners)
    window.dispatchEvent(new CustomEvent('shreyos-open-project', { detail: { projectId: p.id } }));
    // Open THE project window ('explorer' — the single window id used by the
    // titlebar, taskbar button, insert() and eject() alike)
    os.wAction('explorer', 'open');
    if (!os.reducedMotion) playWindowOpen();
  }, [os]);

  const insert = p => {
    if (mounted === p.id || booting) return;
    playClick();

    // a real drive: whatever is in there comes out first — window closes AND
    // the drive empties visually before the next disk travels in
    if (current) { os.wAction('explorer', 'close'); setMounted(null); }

    setOrigin(measureOrigin());
    setReading(true);

    /* Full boot plays once per session so the moment lands — comparing all
       four projects back-to-back (a normal hiring-manager workflow) shouldn't
       pay the ~3.2s cost with zero new information every time after the
       first. Subsequent inserts this session take the same fast path as
       reducedMotion straight into launch(). */
    const seen = sessionStorage.getItem('shreyos_pjboot_seen');
    const skip = os.reducedMotion || seen;
    const go = () => {
      if (skip) { launch(p); return; }
      sessionStorage.setItem('shreyos_pjboot_seen', '1');
      setBooting(p);
    };
    setTimeout(go, skip ? 0 : 300);
  };

  const eject = () => {
    playClick();
    os.wAction('explorer', 'close');
    setMounted(null);
    setReading(false);
  };

  const goNext = () => {
    playClick();
    const t = document.getElementById('journey') || document.getElementById('contact');
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  };

  const state = os.wins.explorer || { open: false, minimized: false };

  return (
    <section id="projects" className="pj-section" ref={rootRef}>

      <header className="pj-break">
        <span className="pj-idx">04</span>
        <span className="pj-title">Projects</span>
        <span className="pj-sub">// program_manager.exe — {PROJECTS.length} running</span>
        <span className="pj-rule" />
      </header>

      {/* ── the caddy ── */}
      <div className="pj-caddy">
        <div className="pj-caddy-lip">
          <span>Program Manager</span>
          <span className="pj-lip-sp" />
          <span className="pj-lip-meta">A:\PROJECTS\ · {PROJECTS.length} PROGRAMS RUNNING</span>
        </div>

        <div className="pj-slots pj-progman">
          {PROJECTS.map(p => {
            const TIco = FEED_ICON[p.feed] || OsHardDisk;
            const running = mounted === p.id;
            return (
              <div className="pj-slot" key={p.id}>
                <button
                  className={`pj-app${running ? ' pj-app-run' : ''}`}
                  onClick={() => insert(p)}
                  aria-label={`Run ${p.name} — boots from Drive A`}>

                  {/* ── real window chrome: the section speaks the OS's own
                         language, so it can't drift off-theme ── */}
                  <span className="pj-app-tb" aria-hidden="true">
                    <TIco size={16} className="pj-app-tico" />
                    <span className="pj-app-title">{p.vol}{running ? ' — running' : ''}</span>
                    <span className="pj-app-btns"><i>_</i><i>□</i><i>✕</i></span>
                  </span>
                  <span className="pj-app-menu" aria-hidden="true">
                    <i>File</i><i>Edit</i><i>View</i><i>Help</i>
                    <span className={`pj-app-dot${running ? ' pj-app-dot-run' : ''}`} />
                  </span>

                  {/* ── the app's viewport: the live scene IS the pitch ── */}
                  <span className="pj-app-body">
                    <FeedPreview kind={p.feed} />
                    <span className="pj-mon-scan" />
                    <span className="pj-app-cta">▸ RUN {p.vol}</span>
                  </span>

                  {/* ── statusbar carries the label content ── */}
                  {/* Footer: three fixed rows so nothing ever collides or
                     truncates — name owns its row, tech owns its row, and
                     the meta row keeps badge (left) / date (right) apart. */}
                  <span className="pj-app-foot">
                    <span className="pj-app-name-row">
                      <span className="pj-lb-sq" />
                      <span className="pj-lb-name">{p.name}</span>
                    </span>
                    <span className="pj-app-tech">
                      {p.tech
                        .flatMap(t => t.split('·'))
                        .map(t => t.trim())
                        .filter(Boolean)
                        .map((t, i) => (
                          <span key={i} className="pj-app-tech-i">{t}</span>
                        ))}
                    </span>
                    <span className="pj-app-meta">
                      {p.badge && <span className="pj-lb-badge">{p.badge}</span>}
                      <span className="pj-app-sb-sp" />
                      <span className="pj-app-date">{p.date}</span>
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── the drive ── */}
        <div className="pj-drive">
          <span className="pj-drive-lbl">DRIVE A:</span>
          <div className={`pj-drive-slot${mounted ? ' pj-has' : ''}`} ref={slotRef}>
            <span className="pj-edge" />
          </div>
          <button className="pj-eject" onClick={eject} disabled={!mounted}
            aria-label="Eject disk" title="Eject" />
          <span className={`pj-led${mounted || reading ? ' pj-led-on' : ''}${reading ? ' pj-led-busy' : ''}`} />
          <span className="pj-readout">
            {reading ? <>LOADING <b>A:\PROJECTS\{(booting || current)?.vol}</b></>
              : current ? <><b>A:\PROJECTS\{current.vol}</b> — running{state && state.minimized ? ' (minimized)' : ''}</>
              : 'IDLE — run a program to boot from A:'}
          </span>
        </div>
      </div>

      {/* ── the window grows out of the drive slot ── */}
      <div className="pj-stage" ref={stageRef}>
        {current && (
          <ProjectWindow
            key={current.id}
            p={current}
            originPct={origin}
            onEject={eject}
            winCtl={winCtl}
            state={state}
          />
        )}
      </div>

      {!current && !booting && (
        <div className="pj-hint">RUN A PROGRAM — IT BOOTS FROM DRIVE A:</div>
      )}

      <button className="pj-next" onClick={goNext}>
        <span>05 · Journey</span><span className="pj-next-arw">▼</span>
      </button>

      {booting && (
        <BootTerminal
          project={booting}
          reduced={os.reducedMotion}
          onDone={() => launch(booting)}
        />
      )}
    </section>
  );
}