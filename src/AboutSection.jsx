/* ══════════════════════════════════════════════════════════════════════════
   AboutSection.jsx — "About.exe · Personnel File"  (SHREY/OS · section 02)
   ---------------------------------------------------------------------------
   Sits between HeroSection (01) and SkillsSection (03).

   THEME: never sets data-theme itself — OSContext writes it on <html>, so
   light/dark cascades for free via [data-theme] in global.css. Accent comes
   from --sk-sig (navy in light · amber in dark), shared with Skills.

   BEHAVIOUR
   • Sticky scroll track: the window pins to the viewport while four records
     (Personal → History → Method → Availability) advance with scroll, and
     rewind cleanly on scroll-up.
   • Only ONE record is mounted-visible at a time (no stacking) — each entry
     replays a rise-settle pop-in.
   • Clicking a tab locks the scroll driver until the reader scrolls out of
     that record's band, so a click is never yanked away mid-sentence.
   • Full window management: drag (viewport-clamped), minimize, close, taskbar
     registration via os.wAction('about', …).

   App usage:
     <OSProvider><FixedComponents>
       <HeroSection/><AboutSection/><SkillsSection/>
     </FixedComponents></OSProvider>
   ═════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useOS, playClick, playWindowOpen } from './OSContext';

/* Renders a static string containing only <b>…</b> spans as safe JSX —
   replaces dangerouslySetInnerHTML (a lint magnet and one CMS-paste away
   from XSS) with a 6-line splitter. */
const renderB = (html) => String(html).split(/<b>|<\/b>/g).map((part, i) =>
  i % 2 ? <b key={i}>{part}</b> : (part ? <span key={i}>{part}</span> : null));

/* ── records — every field grounded in the CV ──────────────────────────── */
const RECORDS = [
  {
    id: 'personal',
    label: 'Personal',
    head: 'Applicant Record',
    meta: 'SPATEL · REF 141102',
    groups: [
      {
        cat: 'Identity',
        count: '5 fields',
        rows: [
          ['Name',    'Shrey Patel', 'hl'],
          ['Reading', 'MSc Artificial Intelligence — Brunel University London'],
          ['Term',    'January 2026 — April 2027'],
          ['Prior',   'BEng Information Technology — First Class with Distinction'],
          ['Status',  'SEEKING PLACEMENT · 2026–27', 'ok'],
        ],
      },
    ],
    prose: [
      { lead: true, html: 'I build machine-learning systems and the practical applications that sit around them. Nine months as a <b>Data Science Intern at Petpooja</b> taught me more about shipping real systems than any module did — and it\u2019s why I think about data and pipelines first, models second.' },
      { html: 'I care about the boring 80%: the ingestion, the evaluation, the part that has to still be working at 3am. A model that only wins on a slide isn\u2019t finished.' },
    ],
    proseHead: 'Summary',
    jump: { label: 'History', to: 'history', pre: 'Full record continues under ' },
  },
  {
    id: 'history',
    label: 'History',
    head: 'Employment & Education History',
    meta: 'RECORD 02 · VERIFIED',
    groups: [
      {
        cat: 'Filed under',
        count: 'career switch',
        rows: [
          ['Employer',   'Petpooja, India — Data Science Intern', 'hl'],
          ['Period',     'September 2024 — May 2025'],
          ['Transition', 'Information Technology → Artificial Intelligence'],
        ],
      },
    ],
    metrics: [
      ['Query latency', '−30%', 'dn'],
      ['OCR accuracy',  '+15%', 'up'],
      ['SQL pipelines', '800+'],
      ['Prompts evaluated', '100+'],
    ],
    metricsHead: 'Measured output',
    proseHead: 'Statement',
    prose: [
      { html: 'The honest version: I didn\u2019t start in AI. I did an <b>IT engineering degree</b> and came out with a First — databases, algorithms, and building things that don\u2019t fall over.' },
      { html: 'The turn happened at Petpooja. Real problems, real stakes: optimising <b>800+ BigQuery SQL pipelines</b> and cutting query latency by <b>~30%</b>; designing and evaluating <b>100+ structured prompts</b> for vision-language models, pushing OCR accuracy up <b>~15%</b>. That was where the interesting work was. I wanted more of it.' },
      { html: 'So the MSc wasn\u2019t a reset — it was a deliberate step deeper into the part of the stack I\u2019d already fallen for. The IT foundation didn\u2019t get thrown away; it\u2019s the reason I\u2019m useful.' },
    ],
    jump: { label: 'Journey', to: '#journey', pre: 'Timeline in full: ' },
  },
  {
    id: 'method',
    label: 'Method',
    head: 'Working Principles',
    meta: '4 processes · nominal',
    principles: [
      { k: 'AUTOMATE', html: '<b>I automate the tedious.</b> AI Radar scrapes, summarises and stores <b>260+ records a day</b> across AI papers, news, tools and benchmarks — so keeping up stops being an hour of somebody\u2019s morning.' },
      { k: 'OPTIMISE', html: '<b>I optimise what\u2019s slow.</b> At Petpooja that meant <b>800+ SQL pipelines</b> and a <b>~30% latency cut</b>. I like making the slow thing fast and the flaky thing reliable.' },
      { k: 'MEASURE',  html: '<b>I measure what I ship.</b> AI Radar grades its own summaries with an LLM-as-judge framework on every pipeline run. If you can\u2019t see quality drift, you don\u2019t have quality.' },
      { k: 'LEAD',     html: '<b>I lead when it counts.</b> Took a team to <b>1st place</b> in a company hackathon — an AI kitchen system doing demand forecasting, waste reduction and recipe generation.' },
    ],
    principlesHead: 'Observed behaviour',
    jump: { label: 'Projects', to: '#projects', pre: 'Evidence attached under ' },
  },
  {
    id: 'avail',
    label: 'Availability',
    head: 'Availability',
    meta: 'STATUS · OPEN',
    groups: [
      {
        cat: 'Parameters',
        count: '4 fields',
        rows: [
          ['Seeking',  'AI / ML placement', 'hl'],
          ['Window',   '2026 — 2027'],
          ['Location', 'London, or remote'],
          ['Status',   'OPEN TO OFFERS', 'ok'],
        ],
      },
    ],
    proseHead: 'Notes',
    prose: [
      { html: 'I\u2019m most useful where there\u2019s messy data to tame, a pipeline that needs to be faster, or an LLM/RAG feature that has to actually ship and be measured — not demoed once and quietly forgotten.' },
      { html: 'Comfortable in <b>Python, SQL, PyTorch, TensorFlow, FastAPI</b>. Happier still when the problem is unglamorous and the fix is measurable.' },
    ],
    contact: true,
    banner: 'Currently seeking an <b>AI/ML placement for 2026–27</b> — London or remote.',
  },
];

const IDS = RECORDS.map(r => r.id);


/* ── one record's page — the single pinned panel, on every screen size.
   No IntersectionObserver here: the parent remounts this component via its
   `key` whenever the record changes, and that remount is what replays the
   CSS entry animation. That mechanism works identically on mobile. ── */
function Record({ r, onJump, onContact }) {
  return (
    <div className="ab-page">
      <div className="ab-page-head">
        <span className="ab-ph">{r.head}</span>
        <span className="ab-ph-spacer" />
        <span className="ab-ph-meta">{r.meta}</span>
      </div>

      <div className="ab-scroll">
        {r.groups?.map(g => (
          <div key={g.cat}>
            <div className="ab-grp">
              <span className="ab-tw">▼</span>{g.cat}
              {g.count && <span className="ab-cnt">{g.count}</span>}
            </div>
            <div className="ab-rows">
              {g.rows.map(([k, v, cls]) => (
                <div key={k} className="ab-row">
                  <span className="ab-k">{k}</span>
                  <span className={`ab-v${cls ? ' ab-v-' + cls : ''}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {r.metrics && (
          <>
            <div className="ab-grp"><span className="ab-tw">▼</span>{r.metricsHead}</div>
            <div className="ab-metrics">
              {r.metrics.map(([k, v, dir]) => (
                <div key={k} className="ab-metric">
                  <span className="ab-mk">{k}</span>
                  <span className={`ab-mv${dir ? ' ab-mv-' + dir : ''}`}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {r.principles && (
          <>
            <div className="ab-grp">
              <span className="ab-tw">▼</span>{r.principlesHead}
              <span className="ab-cnt">{r.principles.length} principles</span>
            </div>
            <ul className="ab-plist">
              {r.principles.map(p => (
                <li key={p.k}>
                  <span className="ab-pk">{p.k}</span>
                  <span className="ab-pb">{renderB(p.html)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {r.prose && (
          <>
            {r.proseHead && <div className="ab-grp"><span className="ab-tw">▼</span>{r.proseHead}</div>}
            <div className="ab-prose">
              {r.prose.map((p, i) => (
                <p key={i} className={p.lead ? 'ab-lead' : undefined}>{renderB(p.html)}</p>
              ))}
            </div>
          </>
        )}

        {r.jump && (
          <div className="ab-prose">
            <p>{r.jump.pre}
              <button className="ab-jump" onClick={() => onJump(r.jump.to)}>{r.jump.label}</button>.
            </p>
          </div>
        )}

        {r.contact && (
          <div className="ab-prose">
            <p>If that sounds like your team, the fastest route is the{' '}
              <button className="ab-jump" onClick={onContact}>Contact</button>{' '}
              window — it dials out to me directly. The CV is on the desktop.
            </p>
          </div>
        )}

        {r.banner && (
          <div className="ab-seeking">
            <span className="ab-sd2" />
            <span className="ab-seek-txt">{renderB(r.banner)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutSection() {
  const os = useOS();
  const winState = os.wins.about || { open: true, minimized: false };
  const winCtl = !os.isMobile;

  const rootRef = useRef(null);
  const winRef  = useRef(null);
  const dragRef = useRef({ tx: 0, ty: 0 });
  /* Live open flag mirror — re-entering the section relaunches a closed
     window instead of leaving a permanently empty scroll track. */
  const winOpenRef = useRef(false);

  /* Launcher pulse: Start menu / desktop launchers scroll here and flash the
     window with the phosphor border — same pattern as the Projects cabinet. */
  useEffect(() => {
    const handler = () => {
      const el = rootRef.current?.querySelector('.ab-win');
      if (!el) return;
      el.classList.add('ab-win-flash');
      setTimeout(() => el.classList.remove('ab-win-flash'), 1800);
    };
    window.addEventListener('shreyos-about-boot', handler);
    return () => window.removeEventListener('shreyos-about-boot', handler);
  }, []);
  const inView  = useRef(false);

  const [rec, setRec]   = useState(0);   // which record shows
  const [seen, setSeen] = useState(0);   // furthest reached → tab enabled
  const [anim, setAnim] = useState(0);   // bump to replay pop-in
  const lockRef = useRef(null);          // band index locked by a tab click
  const recRef  = useRef(0);
  recRef.current = rec;

  /* ── reveal + auto-open the window when the section enters view ───────── */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        if (e.isIntersecting) {
          el.classList.add('ab-in');
          if (winCtl && !winOpenRef.current) {
            os.wAction('about', 'open');
            if (!os.reducedMotion) playWindowOpen();
          }
        }
      },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [winCtl]);

  useEffect(() => { winOpenRef.current = !!os.wins.about?.open; }, [os.wins.about]);

  /* ── scroll choreography: four equal bands across the sticky track ──────
     Runs on EVERY screen size. Mobile uses the same pinned panel and the same
     one-record-at-a-time swap as desktop — only the window chrome controls
     (drag / minimize / close) are desktop-only.                            */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;

    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.max(0, Math.min(1, -r.top / total));
      el.style.setProperty('--ab-p', p.toFixed(4));

      // four bands across the first 92% of the track
      const band = Math.max(0, Math.min(IDS.length - 1,
        Math.floor((p / 0.92) * IDS.length)));

      // a tab click locks the driver until the reader scrolls to a new band
      if (lockRef.current !== null) {
        if (band === lockRef.current) return;
        lockRef.current = null;
      }

      if (band !== recRef.current) {
        setRec(band);
        setAnim(a => a + 1);
        setSeen(s => (band > s ? band : s));
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    tick();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ── drag (transform-based, viewport-clamped — mirrors SkillsSection) ─── */
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

  /* ── tab click: swap the pinned panel, lock the driver for that band.
     Identical on every screen size. */
  const pickTab = i => {
    playClick();
    if (i > seen) return;
    lockRef.current = i;
    if (i !== rec) { setRec(i); setAnim(a => a + 1); }
  };

  const goJump = to => {
    playClick();
    const i = IDS.indexOf(to);
    if (i > -1) {
      if (i > seen) setSeen(i);
      lockRef.current = i;
      setRec(i); setAnim(a => a + 1);
      return;
    }
    const t = document.querySelector(to);
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  };

  const goSkills = () => {
    playClick();
    const t = document.getElementById('skills');
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  };

  const R = RECORDS[rec];

  return (
    <section id="about" className="ab-section" ref={rootRef}>
      <div className="ab-pin">

        <header className="ab-break">
          <span className="ab-idx">02</span>
          <span className="ab-title">About</span>
          <span className="ab-sub">// personnel_file.exe — open</span>
          <span className="ab-rule" />
        </header>

        <div className="ab-win" ref={winRef}
          style={winCtl && (!winState.open || winState.minimized) ? { display: 'none' } : undefined}>
          <div className="ab-crt" aria-hidden="true" />

          <div className="ab-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
            <span className="tb-live-dot" />
            <svg className="ab-tico" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M1.5 3.5h4.6l1.3 1.6h7.1v8.4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                fill="#0d0f12" stroke="#cfd6dd" strokeWidth="1" strokeLinejoin="round" />
              <path d="M2.4 6.6h11.4l-1.3 6.4a.9.9 0 0 1-.9.7H2.6z" fill="#ffb454" opacity=".9" />
            </svg>
            <span className="ab-titletxt">About — Personnel File</span>
            <div className="ab-winbtns">
              <button className="win-btn" aria-label="Minimize About"
                onClick={() => { if (!winCtl) return; playClick(); os.wAction('about', 'minimize'); }}>_</button>
              <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
              <button className="win-btn win-close" aria-label="Close About"
                onClick={() => { if (!winCtl) return; playClick(); os.wAction('about', 'close'); }}>✕</button>
            </div>
          </div>

          <div className="ab-menubar">
            <span>File</span><span>Edit</span><span>View</span><span>Help</span>
            <span className="ab-menu-spacer" />
            <span className="ab-rate"><span className="ab-rate-dot" />Record: {R.id}</span>
          </div>

          <div className="ab-tabs" role="tablist">
            {RECORDS.map((r, i) => (
              <button key={r.id} role="tab"
                aria-selected={i === rec}
                className={`ab-tab${i === rec ? ' ab-tab-active' : ''}${i <= seen ? ' ab-tab-seen' : ''}`}
                onClick={() => pickTab(i)}>
                {r.label}
              </button>
            ))}
          </div>

          <div className="ab-body">
            <div className="ab-field">
              {/* ONE record on every screen size. The key change remounts it,
                  which replays the fade — mobile included. */}
              <Record key={`${R.id}-${anim}`} r={R}
                onJump={goJump}
                onContact={() => { playClick(); os.handleAction('contact'); }} />
            </div>
          </div>

          <div className="ab-statusbar">
            <span className="ab-sb">Record: <b>{rec + 1}</b> of {RECORDS.length}</span>
            <span className="ab-sb">{R.label}</span>
            <span className="ab-sb ab-sb-grow">
              <span className="ab-pips">
                {RECORDS.map((r, i) => (
                  <span key={r.id} className={`ab-pip${i <= rec ? ' ab-pip-on' : ''}`} />
                ))}
              </span>
            </span>
            <span className="ab-sb">MSc AI · <b>Brunel</b></span>
          </div>
        </div>

        {winCtl && !winState.open && (
          <button className="sec-relaunch"
            onClick={() => { playClick(); os.wAction('about', 'open'); playWindowOpen(); }}>
            personnel_file.exe — relaunch ▸
          </button>
        )}

        <button className="ab-next" onClick={goSkills}>
          <span>03 · Skills</span><span className="ab-next-arw">▼</span>
        </button>

      </div>
    </section>
  );
}