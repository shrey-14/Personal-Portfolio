/* ══════════════════════════════════════════════════════════════════════════
   ProjectsWindow.jsx — Full-screen Win95 project viewer (SHREY/OS)
   ---------------------------------------------------------------------------
   Opened from:
     • disk click in ProjectsSection (after DOS boot) via shreyos-open-project event
     • taskbar "Projects" button (restore)

   Layout (matches mockup):
     titlebar → menubar → [sidebar: project list] [detail: tabs + content]
     → action bar → statusbar

   Tabs: Summary (pitch + field rows + metrics) · Stack (chips) · Architecture
   Wired to OSContext wins.explorer — drag / minimize / close all work.
   ═════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useOS, playClick } from './OSContext';
import { PxExternalLink, PxGitBranch } from './PixelIcons.jsx';
import {
  OsHardDisk, OsMaps, OsText, OsImageViewer, OsCertificate,
} from './OsIcons.jsx';
import { LINKS } from './projectLinks.js';

/* ── All project data (CV-sourced) ─────────────────────────────────────── */
const PROJECTS_DATA = [
  {
    id: 'airadar',
    Ico: OsMaps,
    /* TODO(shrey): set the live Vercel URL + GitHub repo — Launch enables and
       a Source button appears as soon as these are non-null. */
    url:  LINKS.airadar.url,
    repo: LINKS.airadar.repo,
    name: 'AI Radar',
    date: 'May – Jun 2026',
    status: 'LIVE',
    statusColor: '#39FF14',
    path: 'C:\\Projects\\ai\\ai_radar.exe',
    pitch: 'Daily AI news briefing platform with hybrid semantic RAG, delivering personalised digests on demand.',
    fields: [
      { k: 'Processor',  v: 'FastAPI · Next.js' },
      { k: 'Memory',     v: 'PostgreSQL / pgvector' },
      { k: 'Inference',  v: 'Groq LLaMA 3' },
      { k: 'Embeddings', v: 'Jina AI' },
      { k: 'Pipeline',   v: 'Prefect (260+ records/day)' },
      { k: 'Deploy',     v: 'Vercel + Railway' },
    ],
    metrics: [
      { n: 'Hit@1', v: '100%' },
      { n: 'Records/day', v: '260+' },
      { n: 'Latency', v: '<2s' },
    ],
    stack: ['FastAPI','Next.js','PostgreSQL','pgvector','Groq','Jina AI','Prefect','Supabase','Vercel','Railway','Python','React'],
    stackGroups: [
      { label: 'Languages', items: ['Python','React'] },
      { label: 'Backend & API', items: ['FastAPI','Next.js'] },
      { label: 'Data & Vectors', items: ['PostgreSQL','pgvector','Supabase'] },
      { label: 'AI & Inference', items: ['Groq','Jina AI'] },
      { label: 'Orchestration & Deploy', items: ['Prefect','Vercel','Railway'] },
    ],
    stackDesc: 'Production-grade RAG platform — a full async Python backend, vector search, and a scheduled ingest pipeline serving 260+ records every day.',
    arch: [
      { k: 'Retrieval', v: 'Hybrid RAG — semantic vector search + keyword matching via Reciprocal Rank Fusion' },
      { k: 'Routing',   v: 'Confidence-gated fallback that auto-corrects wrong section routing' },
      { k: 'Pipeline',  v: 'Prefect orchestration — scheduled daily ingest across AI feeds' },
      { k: 'Store',     v: 'PostgreSQL + pgvector on Supabase' },
      { k: 'Eval',      v: 'LLM-as-judge framework grading summary quality on every run' },
      { k: 'Deploy',    v: 'Vercel (front-end) · Railway (API) · Supabase (DB + auth)' },
    ],
  },
  {
    id: 'contract',
    Ico: OsText,
    url:  LINKS.contract.url,
    repo: LINKS.contract.repo,
    name: 'Contract Tracker',
    date: '2026',
    status: 'IN DEV',
    statusColor: '#ffb454',
    path: 'C:\\Projects\\ai\\contract_tracker.exe',
    pitch: 'Multi-contract obligation tracker using RAG to surface key clauses and deadlines from legal documents.',
    fields: [
      { k: 'Framework', v: 'LangChain' },
      { k: 'Vector DB', v: 'ChromaDB' },
      { k: 'LLM',       v: 'DeepSeek V3' },
      { k: 'Front-end', v: 'React + Vite' },
      { k: 'Domain',    v: 'Legal AI / NLP' },
    ],
    metrics: [
      { n: 'Pattern', v: 'RAG' },
      { n: 'Interface', v: 'Natural lang.' },
      { n: 'Scope', v: 'Multi-doc' },
    ],
    stack: ['LangChain','ChromaDB','DeepSeek V3','React','Vite','Python','FastAPI'],
    stackGroups: [
      { label: 'Languages', items: ['Python'] },
      { label: 'RAG & LLM', items: ['LangChain','ChromaDB','DeepSeek V3'] },
      { label: 'API & Frontend', items: ['FastAPI','React','Vite'] },
    ],
    stackDesc: 'RAG pipeline over legal documents — LangChain orchestrates chunking and retrieval, DeepSeek V3 synthesises answers in natural language.',
    arch: [
      { k: 'Retrieval', v: 'LangChain orchestration over a ChromaDB vector store' },
      { k: 'Model',     v: 'DeepSeek V3 for extraction and answer synthesis' },
      { k: 'API',       v: 'FastAPI service layer' },
      { k: 'Client',    v: 'React + Vite — query interface + obligation timeline' },
    ],
  },
  {
    id: 'road',
    Ico: OsImageViewer,
    url:  LINKS.road.url,
    repo: LINKS.road.repo,
    name: 'Road Damage Detection',
    date: 'Mar – Apr 2024',
    status: 'COMPLETE',
    statusColor: '#8b929b',
    path: 'C:\\Projects\\cv\\road_damage.exe',
    pitch: 'YOLOv5 object-detection model for road surface damage classification, trained on real-world imagery.',
    fields: [
      { k: 'Model',      v: 'YOLOv5 (fine-tuned)' },
      { k: 'Framework',  v: 'PyTorch' },
      { k: 'Processing', v: 'OpenCV + Pandas' },
      { k: 'Metric',     v: 'mAP@0.5 = 87%' },
      { k: 'Domain',     v: 'Computer Vision' },
    ],
    metrics: [
      { n: 'mAP@0.5', v: '87%' },
      { n: 'Model', v: 'YOLOv5' },
      { n: 'Classes', v: '4' },
    ],
    stack: ['YOLOv5','PyTorch','OpenCV','Pandas','Python','NumPy'],
    stackGroups: [
      { label: 'Languages', items: ['Python'] },
      { label: 'Model & Training', items: ['YOLOv5','PyTorch'] },
      { label: 'Data & Vision', items: ['OpenCV','Pandas','NumPy'] },
    ],
    stackDesc: 'End-to-end computer vision pipeline — PyTorch training loop with custom augmentation, evaluated at mAP@0.5 = 0.87.',
    arch: [
      { k: 'Model',        v: 'YOLOv5 in PyTorch — refined loss functions and training loops' },
      { k: 'Augmentation', v: 'Rotation · scaling · brightness adjustment via OpenCV' },
      { k: 'Classes',      v: 'Longitudinal crack · Transverse crack · Alligator crack · Pothole' },
      { k: 'Evaluation',   v: 'IoU and mAP@0.5 — final score 0.87' },
    ],
  },
  {
    id: 'kitchen',
    Ico: OsCertificate,
    url:  LINKS.kitchen.url,
    repo: LINKS.kitchen.repo,
    name: 'AI Kitchen Optimisation',
    date: 'Mar 2025',
    status: '1ST PLACE',
    statusColor: '#ffb454',
    badge: '1ST PLACE',
    path: 'C:\\Projects\\ai\\kitchen_opt.exe',
    pitch: 'Hackathon-winning system: YOLOv8 inventory detection + demand forecasting + LLM recipe generation.',
    fields: [
      { k: 'Vision',     v: 'YOLOv8 (inventory detection)' },
      { k: 'Forecast',   v: 'XGBoost + Prophet' },
      { k: 'Generation', v: 'LLaMA via Groq API' },
      { k: 'Dashboard',  v: 'Plotly' },
      { k: 'Result',     v: '1st Place — internal hackathon' },
    ],
    metrics: [
      { n: 'Result', v: '1st Place' },
      { n: 'Models', v: '4' },
      { n: 'Domain', v: 'Multimodal' },
    ],
    stack: ['YOLOv8','LLaMA','XGBoost','Prophet','Plotly','Groq','Python','FastAPI'],
    stackGroups: [
      { label: 'Languages', items: ['Python'] },
      { label: 'Vision & Forecasting', items: ['YOLOv8','XGBoost','Prophet'] },
      { label: 'LLM & Inference', items: ['LLaMA','Groq'] },
      { label: 'API & Visualisation', items: ['FastAPI','Plotly'] },
    ],
    stackDesc: '1st-place hackathon winner — four AI models chained together: vision detection feeds a forecasting layer, which drives an LLM recipe generator.',
    arch: [
      { k: 'Vision',     v: 'YOLOv8 — kitchen inventory recognition' },
      { k: 'Forecasting',v: 'XGBoost + Prophet for demand prediction' },
      { k: 'Generation', v: 'LLaMA via Groq API — recipes from ingredient lists' },
      { k: 'Refinement', v: 'Few-shot prompting — consistent format + nutritional guidelines' },
      { k: 'Viz',        v: 'Plotly dashboard — real-time insights' },
    ],
  },
];

const TABS = ['Summary', 'Stack', 'Architecture'];

function TabContent({ project, tab }) {
  if (tab === 0) return (
    <div className="pw-tab-body">
      <div className="pw-proj-head">
        <span className="pw-proj-ico"><project.Ico size={32} /></span>
        <div className="pw-proj-info">
          <div className="pw-proj-name">{project.name}</div>
          <div className="pw-proj-date">{project.date}</div>
          <div className="pw-proj-pitch">{project.pitch}</div>
        </div>
        <span className="pw-proj-status" style={{ color: project.statusColor }}>
          ● {project.status}
        </span>
      </div>
      {project.arch?.[0] && (
        <div className="pw-signature">
          <span className="pw-signature-label">{project.arch[0].k}</span>
          {project.arch[0].v}
        </div>
      )}
      <div className="pw-fields">
        {project.fields.map(f => (
          <div className="pw-field-row" key={f.k}>
            <span className="pw-fk">{f.k}:</span>
            <span className="pw-fv">{f.v}</span>
          </div>
        ))}
      </div>
      <div className="pw-metrics">
        {project.metrics.map(m => (
          <div className="pw-metric" key={m.n}>
            <div className="pw-mv">{m.v}</div>
            <div className="pw-mk">{m.n}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 1) return (
    <div className="pw-tab-body">
      <div className="pw-section-head">Technologies — {project.name}</div>
      {project.stackDesc && (
        <div className="pw-stack-desc">{project.stackDesc}</div>
      )}
      {project.stackGroups
        ? project.stackGroups.map(g => (
            <div className="pw-chip-group" key={g.label}>
              <div className="pw-chip-group-label">{g.label}</div>
              <div className="pw-stack-grid">
                {g.items.map(t => <div className="pw-chip" key={t}>{t}</div>)}
              </div>
            </div>
          ))
        : <div className="pw-stack-grid">{project.stack.map(t => <div className="pw-chip" key={t}>{t}</div>)}</div>
      }
    </div>
  );

  if (tab === 2) return (
    <div className="pw-tab-body">
      <div className="pw-section-head">Architecture — {project.arch.length} components</div>
      {project.stackDesc && (
        <div className="pw-arch-intro">{project.stackDesc}</div>
      )}
      <div className="pw-arch-rows">
        {project.arch.map(r => (
          <div className="pw-arch-row" key={r.k}>
            <span className="pw-arch-k">{r.k}</span>
            <span className="pw-arch-v">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return null;
}

export default function ProjectsWindow() {
  const os = useOS();
  const winState = os.wins.explorer || { open: false, minimized: false };
  const [selId, setSelId] = useState('airadar');
  const [tab, setTab] = useState(0);
  const winRef = useRef(null);
  const dragRef = useRef({ tx: 0, ty: 0, pointerId: null, raf: 0 });

  useEffect(() => () => { if (dragRef.current.raf) cancelAnimationFrame(dragRef.current.raf); }, []);

  /* ProjectsSection fires this after DOS boot to pre-select the disk */
  useEffect(() => {
    const handler = e => {
      if (e.detail?.projectId) { setSelId(e.detail.projectId); setTab(0); }
    };
    window.addEventListener('shreyos-open-project', handler);
    return () => window.removeEventListener('shreyos-open-project', handler);
  }, []);

  const project = PROJECTS_DATA.find(p => p.id === selId) || PROJECTS_DATA[0];

  const onTitlebarDown = useCallback(e => {
    if (e.target.closest?.('.win-btn')) return;
    const el = winRef.current; if (!el) return;
    const st = dragRef.current;
    // Multi-touch protection: a second finger mid-drag would jump the window.
    if (st.pointerId != null) return;

    const bar = e.currentTarget;          // captured now — currentTarget is null once async
    const rect = el.getBoundingClientRect();
    const homeLeft = rect.left - st.tx, homeTop = rect.top - st.ty, w = rect.width;
    const sx = e.clientX, sy = e.clientY, tx0 = st.tx, ty0 = st.ty;

    st.pointerId = e.pointerId;
    try { bar.setPointerCapture(e.pointerId); } catch { /* capture unsupported */ }

    const flush = () => {
      st.raf = 0;
      el.style.transform = `translate(${st.tx}px,${st.ty}px)`;
    };
    const onMove = ev => {
      if (ev.pointerId !== st.pointerId) return;
      let dtx = tx0 + (ev.clientX - sx), dty = ty0 + (ev.clientY - sy);
      dtx = Math.max(-(w - 80) - homeLeft, Math.min(window.innerWidth - 80 - homeLeft, dtx));
      dty = Math.max(-homeTop, Math.min(window.innerHeight - 54 - homeTop, dty));
      st.tx = dtx; st.ty = dty;
      // One composited write per frame — pointermove outpaces the display.
      if (!st.raf) st.raf = requestAnimationFrame(flush);
    };
    const onUp = ev => {
      if (ev.pointerId !== st.pointerId) return;
      if (st.raf) { cancelAnimationFrame(st.raf); flush(); }
      st.pointerId = null;
      try { bar.releasePointerCapture(ev.pointerId); } catch { /* already released */ }
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }, []);

  if (!winState.open || winState.minimized) return null;

  return (
    <div className="pw-window" ref={winRef}>
      {/* titlebar */}
      <div className="pw-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
        <span className="pw-title-ico"><OsHardDisk size={16} className="title-ico-img" /></span>
        <span className="pw-title-txt">{project.name} — Project Details</span>
        <span className="tb-live-dot" aria-hidden="true" />
        <div className="pw-winbtns">
          <button className="win-btn" aria-label="Minimize"
            onClick={() => { playClick(); os.wAction('explorer','minimize'); }}>_</button>
          <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
          <button className="win-btn win-close" aria-label="Close"
            onClick={() => { playClick(); os.wAction('explorer','close'); window.dispatchEvent(new CustomEvent('shreyos-eject-disk')); }}>✕</button>
        </div>
      </div>

      {/* menubar */}
      <div className="pw-menubar">
        {['File','Edit','View','Help'].map(m => (
          <button key={m} className="pw-menu" onClick={playClick}>{m}</button>
        ))}
      </div>

      {/* main body: sidebar + detail */}
      <div className="pw-body">
        {/* sidebar — all projects */}
        <div className="pw-sidebar">
          <div className="pw-sidebar-head">Projects</div>
          <div className="pw-sidebar-list">
            {PROJECTS_DATA.map(p => (
              <button key={p.id}
                className={'pw-sidebar-item' + (selId === p.id ? ' pw-sidebar-active' : '')}
                onClick={() => { playClick(); setSelId(p.id); setTab(0); }}>
                <span className="pw-si-ico"><p.Ico size={16} /></span>
                <div className="pw-si-info">
                  <span className="pw-si-name">{p.name}</span>
                  <span className="pw-si-date">{p.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* detail pane */}
        <div className="pw-detail">
          <div className="pw-tabs" role="tablist">
            {TABS.map((t, i) => (
              <button key={t} role="tab" aria-selected={i === tab}
                className={'pw-tab' + (i === tab ? ' pw-tab-active' : '')}
                onClick={() => { playClick(); setTab(i); }}>
                {t}
              </button>
            ))}
          </div>
          <div className="pw-content" key={selId + '-' + tab}>
            <TabContent project={project} tab={tab} />
          </div>
        </div>
      </div>

      {/* action bar */}
      <div className="pw-actionbar">
        {project.url
          ? <a className="pw-btn pw-btn-primary" href={project.url}
              target="_blank" rel="noopener noreferrer" onClick={playClick}>
              <PxExternalLink size={24} className="pw-btn-ico" /> Launch</a>
          : <button className="pw-btn pw-btn-disabled" disabled
              title="Not public yet — see Architecture for the build">
              <PxExternalLink size={24} className="pw-btn-ico" /> Launch</button>
        }
        {project.repo && (
          <a className="pw-btn" href={project.repo}
            target="_blank" rel="noopener noreferrer" onClick={playClick}>
            <PxGitBranch size={24} className="pw-btn-ico" /> Source</a>
        )}
        <button className="pw-btn" onClick={() => { playClick(); setTab(2); }}>Architecture</button>
        <span className="pw-path" title={project.path}>{project.path}</span>
        <button className="pw-btn pw-btn-close"
          onClick={() => { playClick(); os.wAction('explorer','close'); window.dispatchEvent(new CustomEvent('shreyos-eject-disk')); }}>Close</button>
      </div>

      {/* statusbar */}
      <div className="pw-statusbar">
        <span className="pw-sb">{project.name}</span>
        <div className="pw-sb-sep" />
        <span className="pw-sb pw-sb-status" style={{ color: project.statusColor }}>
          ● {project.status}
        </span>
        <div className="pw-sb-grow" />
        <span className="pw-sb">{TABS[tab]}</span>
      </div>
    </div>
  );
}