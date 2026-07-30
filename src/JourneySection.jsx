/* ══════════════════════════════════════════════════════════════════════════
   JourneySection.jsx — "Training Monitor"  (SHREY/OS · section 05)
   ---------------------------------------------------------------------------
   Order: Hero (01) → About (02) → Skills (03) → Projects (04) → Journey (05).

   CONCEPT
     Six years as a training run. Left 65%: a vertical carousel of epoch cards.
     Right 35%: the model-loss curve those epochs annotate.

     The Disk Defragmenter framing was cut — defrag ("scattered → contiguous")
     and a training run ("high error → low error") are two different stories
     about the same six years, and running both left neither owning the
     section. The curve won: it does the narrative work and the x-axis IS the
     timeline. The May–Dec 2025 stretch is simply x-axis the curve passes
     through — no marker, no label. A real training run has quiet epochs.

   SYNC — the part that matters
     Card position and curve draw are NOT separate animations. Both derive from
     ONE scroll number (`prog`):
         curve  → drawn to  round(prog * PTS) points
         live   → last EPOCH whose `at` <= prog * SPAN
     So when the card slides 01→02, the curve is provably at epoch 02's marker
     at that same instant. Drift is impossible by construction.

   THEME
     Never sets data-theme — OSContext writes it on <html>; [data-theme] in
     global.css cascades. Accent --jn-sig mirrors --sk-sig / --ab-sig / --pj-sig
     (navy #000080 light · amber #ffb454 dark). Curve colours are read from CSS
     vars at paint time, so the canvas re-themes with everything else.

   HEIGHT
     540vh sticky track. REQUIRES DIFF 1 (scope HeroSection.readTarget to the
     hero's own .scroll-track). Without it this section starves the hero of the
     progress it needs to reach stage 3 — the same failure About@420vh caused.
   ═════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import useWindowDrag from './useWindowDrag';
import { useOS, playClick } from './OSContext';

/* Safe JSX bold-splitter for static strings containing only <b>…</b> spans —
   replaces dangerouslySetInnerHTML. */
const renderB = (html) => String(html).split(/<b>|<\/b>/g).map((part, i) =>
  i % 2 ? <b key={i}>{part}</b> : (part ? <span key={i}>{part}</span> : null));

/* ── every figure below is from the CV — nothing invented ───────────────── */
const EPOCHS = [
  {
    ep: '01', tag: 'EDU', at: 0.00,
    title: 'BEng Information Technology',
    date: 'NOV 2021 — MAY 2025',
    where: 'LJ Institute of Engineering & Technology, India',
    rows: [
      ['Result',  '<b>First Class with Distinction</b>'],
      ['Modules', 'AI · Computer Vision · DBMS · Algorithms'],
      ['Learned', 'Python · SQL · the habit of finishing things'],
    ],
  },
  {
    ep: '02', tag: 'WORK', at: 0.30,
    title: 'Data Science Intern',
    date: 'SEP 2024 — MAY 2025',
    where: 'Petpooja — overlapping final year',
    rows: [
      ['Pipelines', '<b>800+</b> BigQuery SQL optimised'],
      ['Latency',   '<b>−30%</b> query latency'],
      ['Prompts',   '<b>100+</b> structured · OCR <b>+15%</b>'],
    ],
  },
  {
    ep: '03', tag: 'WIN', at: 0.52,
    title: 'Hackathon — 1st Place',
    date: 'MAR 2025',
    where: 'AI-Powered Kitchen Optimization System',
    rows: [
      ['Role',  '<b>Team lead</b>'],
      ['Stack', 'YOLOv8 · LLaMA · XGBoost · Prophet'],
      ['Scope', 'Forecasting · waste reduction · recipes'],
    ],
  },
  {
    ep: '04', tag: 'MSC', at: 0.82,
    title: 'MSc Artificial Intelligence',
    date: 'JAN 2026 — APR 2027',
    where: 'Brunel University London',
    rows: [
      ['Modules',  'ML · Deep Learning · AI · Data Visualisation'],
      ['Building', 'AI Radar · Multi-Contract Obligation Tracker'],
      ['Seeking',  '<b>AI/ML placement 2026–27</b>'],
    ],
  },
];

/* ── the run. Seeded so it is identical on every load and every theme flip.
     Shape: sharp early drop, then a noisy plateau — what a real curve looks
     like. Still descending at the end: he is mid-MSc, so STATUS reads
     TRAINING, never CONVERGED. ── */
const PTS = 52;
const LOSS_LO = 0.8, LOSS_HI = 4.2;

function buildRun() {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const train = [], val = [];
  for (let i = 0; i < PTS; i++) {
    const t = i / (PTS - 1);
    const base = 1.02 + 2.35 * Math.exp(-t * 5.4);
    train.push(Math.max(0.92, base + (rnd() - 0.5) * (0.10 + 0.20 * Math.exp(-t * 3))));
    val.push(Math.max(0.86, base + (rnd() - 0.5) * (0.22 + 0.34 * Math.exp(-t * 2.4)) + 0.02));
  }
  return { train, val };
}
const RUN = buildRun();
/* each epoch's index on the curve — spaced so all four land at visibly
   different losses (bunching 03/04 made the last two look identical) */
const EP_AT = EPOCHS.map(e => Math.min(PTS - 1, Math.max(1, Math.round(e.at * PTS))));
/* the card's loss label is READ FROM the curve, so the number on the card and
   the point on the graph can never disagree */
const EP_LOSS = EP_AT.map(i => RUN.train[i].toFixed(2));

/* year ticks along the x-axis — the axis IS the timeline */
const YEARS = [
  { y: '2021', at: 0.00 }, { y: '2022', at: 0.17 }, { y: '2023', at: 0.34 },
  { y: '2024', at: 0.51 }, { y: '2025', at: 0.68 }, { y: '2026', at: 0.84 },
  { y: '2027', at: 1.00 },
];

/* ══════════════════════════════════════════════════════════════════════════
   LOSS CURVE — canvas, re-reads CSS vars each paint so it re-themes for free
  ══════════════════════════════════════════════════════════════════════════ */
function LossPlot({ prog, live, reduced }) {
  const cvRef = useRef(null);
  const boxRef = useRef(null);
  const colorsR = useRef(null);
  /* The sync claim ("card and curve are provably locked") is true but was
     invisible — nothing marked the instant it happened. burstStart tracks
     when `live` last changed so the marker gets one authored burst exactly
     then, not a steady glow indistinguishable from the resting state. */
  const burstStart = useRef(-Infinity);

  const draw = useCallback(() => {
    const cv = cvRef.current, box = boxRef.current;
    if (!cv || !box) return;
    const ctx = cv.getContext('2d');
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Resize the backing store ONLY when the box actually changed — resetting
    // canvas.width every draw forced a full realloc per scroll frame.
    const bw = Math.round(r.width * dpr), bh = Math.round(r.height * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width, H = r.height;

    // Colour cache keyed by theme — 7 getComputedStyle reads per scroll frame
    // collapse into one read per theme switch.
    const themeNow = document.documentElement.getAttribute('data-theme') || 'dark';
    if (!colorsR.current || colorsR.current.theme !== themeNow) {
      const v = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
      colorsR.current = {
        theme: themeNow,
        cGrid: v('--jn-plot-grid'), cAxis: v('--jn-plot-axis'),
        cTrain: v('--jn-train'), cVal: v('--jn-val'),
        cSig: v('--jn-sig'), cDim: v('--jn-plot-dim'), cBg: v('--jn-plot-bg'),
      };
    }
    const { cGrid, cAxis, cTrain, cVal, cSig, cDim, cBg } = colorsR.current;

    const PAD = { l: 36, r: 10, t: 12, b: 26 };
    const X = i => PAD.l + (i / (PTS - 1)) * (W - PAD.l - PAD.r);
    const Y = val => PAD.t + (1 - (val - LOSS_LO) / (LOSS_HI - LOSS_LO)) * (H - PAD.t - PAD.b);

    ctx.clearRect(0, 0, W, H);

    /* gridlines + y ticks */
    ctx.strokeStyle = cGrid; ctx.lineWidth = 1;
    ctx.font = '400 8.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = cDim; ctx.textAlign = 'right';
    [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].forEach(val => {
      const y = Y(val);
      ctx.beginPath(); ctx.moveTo(PAD.l, y + 0.5); ctx.lineTo(W - PAD.r, y + 0.5); ctx.stroke();
      ctx.fillText(val.toFixed(1), PAD.l - 5, y + 3);
    });

    /* x ticks — YEARS, because the axis is the timeline */
    ctx.textAlign = 'center';
    YEARS.forEach(({ y: label, at }) => {
      const x = PAD.l + at * (W - PAD.l - PAD.r);
      ctx.strokeStyle = cGrid;
      ctx.beginPath(); ctx.moveTo(x + 0.5, H - PAD.b); ctx.lineTo(x + 0.5, H - PAD.b + 3); ctx.stroke();
      ctx.fillStyle = cDim;
      ctx.fillText(label.slice(2), x, H - PAD.b + 13);
    });

    /* axes */
    ctx.strokeStyle = cAxis; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l + 0.5, PAD.t);
    ctx.lineTo(PAD.l + 0.5, H - PAD.b + 0.5);
    ctx.lineTo(W - PAD.r, H - PAD.b + 0.5);
    ctx.stroke();

    /* axis titles */
    ctx.fillStyle = cDim; ctx.font = '400 8.5px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('year', PAD.l + (W - PAD.l - PAD.r) / 2, H - 4);
    ctx.save();
    ctx.translate(10, PAD.t + (H - PAD.t - PAD.b) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('loss', 0, 0);
    ctx.restore();

    const n = reduced ? PTS : Math.max(1, Math.min(PTS, Math.round(prog * PTS)));

    /* val — dashed, under train */
    ctx.setLineDash([4, 3]); ctx.strokeStyle = cVal; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = X(i), y = Y(RUN.val[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);

    /* train — solid */
    ctx.strokeStyle = cTrain; ctx.lineWidth = 1.9;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = X(i), y = Y(RUN.train[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();

    /* phosphor afterglow on the leading vertex */
    if (!reduced && n < PTS && n > 0) {
      const x = X(n - 1), y = Y(RUN.train[n - 1]);
      ctx.shadowColor = cSig; ctx.shadowBlur = 12;
      ctx.fillStyle = cSig; ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
      ctx.shadowBlur = 0;
    }

    /* epoch markers — the live one is emphasised, in lockstep with the card */
    EP_AT.forEach((pi, e) => {
      /* `pi > n` not `>=`: the marker must appear the moment its epoch goes
         live, otherwise the card flips to E02 while E02's dot is still absent
         — a visible one-frame desync between the two halves. */
      if (pi > n) return;
      const x = X(pi), y = Y(RUN.train[pi]);
      const isLive = e === live;
      ctx.strokeStyle = isLive ? cSig : cGrid;
      ctx.lineWidth = isLive ? 1.4 : 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, H - PAD.b); ctx.stroke();
      ctx.setLineDash([]);
      /* One authored burst at the instant this epoch went live — an
         expanding, fading ring in the same signature color, not a new
         effect invented for this section. */
      if (isLive) {
        const burstT = Math.max(0, Math.min(1, (performance.now() - burstStart.current) / 460));
        if (burstT < 1) {
          const ringR = 4.2 + burstT * 13;
          ctx.save();
          ctx.globalAlpha = (1 - burstT) * 0.85;
          ctx.strokeStyle = cSig; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(x, y, ringR, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
      }
      if (isLive) { ctx.shadowColor = cSig; ctx.shadowBlur = 10; }
      ctx.fillStyle = isLive ? cSig : cTrain;
      ctx.beginPath(); ctx.arc(x, y, isLive ? 4.2 : 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = isLive ? cSig : cDim;
      ctx.font = '700 8.5px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('E' + EPOCHS[e].ep, x, y - 9);
    });

    /* legend — a real Win95 chart legend box */
    const lw = 64, lh = 25, lx = W - PAD.r - lw - 4, ly = PAD.t + 2;
    ctx.fillStyle = cBg; ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = cAxis; ctx.lineWidth = 1; ctx.strokeRect(lx + 0.5, ly + 0.5, lw, lh);
    ctx.strokeStyle = cTrain; ctx.lineWidth = 1.9;
    ctx.beginPath(); ctx.moveTo(lx + 5, ly + 8.5); ctx.lineTo(lx + 21, ly + 8.5); ctx.stroke();
    ctx.setLineDash([3, 2]); ctx.strokeStyle = cVal; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(lx + 5, ly + 17.5); ctx.lineTo(lx + 21, ly + 17.5); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cDim; ctx.font = '400 8px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('train', lx + 25, ly + 11);
    ctx.fillText('val', lx + 25, ly + 20);
  }, [prog, live, reduced]);

  useEffect(() => { draw(); }, [draw]);

  /* Drive the burst ring for ~460ms after `live` changes, independent of the
     scroll-driven draw above — otherwise a visitor who stops scrolling
     exactly on the transition never sees the ring animate out. */
  useEffect(() => {
    if (reduced) return;
    burstStart.current = performance.now();
    let raf = 0;
    const tick = () => {
      draw();
      if (performance.now() - burstStart.current < 460) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, reduced]);

  /* repaint on resize AND on theme flip (canvas can't inherit CSS vars) */
  useEffect(() => {
    const onR = () => draw();
    window.addEventListener('resize', onR);
    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { window.removeEventListener('resize', onR); mo.disconnect(); };
  }, [draw]);

  return (
    <div className="jn-plot" ref={boxRef}>
      <canvas ref={cvRef} className="jn-canvas" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION
  ══════════════════════════════════════════════════════════════════════════ */
export default function JourneySection() {
  const os = useOS();
  const winCtl = !os.isMobile;

  const rootRef  = useRef(null);
  const trackRef = useRef(null);
  const winRef   = useRef(null);
  const onTitlebarDown = useWindowDrag(winRef, { enabled: !!winCtl });

  const [prog, setProg] = useState(0);
  const [live, setLive] = useState(0);

  const state = os.wins?.journey || { open: true, minimized: false };

  /* ── one scroll driver. Everything downstream reads `prog`. ── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (os.reducedMotion) { setProg(1); setLive(EPOCHS.length - 1); return; }

    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.max(0, Math.min(1, -r.top / total));
      /* the run occupies the first 90% of the track; the tail is dwell on the
         final card so it doesn't whip past at the boundary */
      const q = Math.min(1, p / 0.9);
      // quantised: a 540vh track re-rendered the whole section per scroll
      // frame; sub-0.2% deltas draw identically, so skip them
      setProg(prev => (Math.abs(prev - q) > 0.002 || q === 0 || q === 1 ? q : prev));
      let n = 0;
      EPOCHS.forEach((e, i) => { if (q >= e.at) n = i; });
      setLive(n);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    read();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [os.reducedMotion]);

  /* Live open-flag mirror for the reveal observer below */
  const winOpenRef = useRef(false);
  useEffect(() => { winOpenRef.current = !!os.wins.journey?.open; }, [os.wins.journey]);

  /* reveal on enter */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('jn-in');
          // Re-arm: a closed Training Monitor relaunches when the section
          // re-enters view — ✕ dismisses for this pass, not forever.
          if (winCtl && !winOpenRef.current) os.wAction('journey', 'open');
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);



  const jumpTo = i => {
    playClick();
    const el = trackRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: el.offsetTop + total * (EPOCHS[i].at * 0.9 + 0.012),
      behavior: os.reducedMotion ? 'auto' : 'smooth',
    });
  };

  const goNext = () => {
    // Section 06 is now the AI terminal (Contact follows it as 07)
    playClick();
    const el = document.getElementById('ask-shrey');
    if (el) el.scrollIntoView({ behavior: os.reducedMotion ? 'auto' : 'smooth' });
    else os.handleAction('contact');
  };

  const cur = EPOCHS[live];
  const pct = Math.round(prog * 100);
  const status = prog > 0 ? 'TRAINING' : 'IDLE';
  const hidden = winCtl && (!state.open || state.minimized);

  return (
    <section id="journey" className="jn-section" ref={rootRef}>
      <div className="jn-track" ref={trackRef}>
        <div className="jn-pin">
          <div className="jn-inner">

            <header className="jn-break">
              <span className="jn-idx">05</span>
              <span className="jn-title">Journey</span>
              <span className="jn-sub">// training_monitor.exe — running</span>
              <span className="jn-rule" />
            </header>

            {!hidden && (
            <div className="jn-win" ref={winRef} data-win-id="journey">
              <div className="jn-titlebar draggable-titlebar" onPointerDown={onTitlebarDown}>
                <span className="tb-live-dot" />
                <svg className="jn-tico" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="13" height="13" fill="#0d0f12" stroke="#cfd6dd" strokeWidth="1" />
                  <polyline points="3,12 6,7 8,9 13,4" fill="none" stroke="#ffb454" strokeWidth="1.4" />
                </svg>
                <span className="jn-titletxt">Training Monitor — run_shrey_2021_2027</span>
                <div className="jn-winbtns">
                  <button className="win-btn" aria-label="Minimize Training Monitor"
                    onClick={() => { playClick(); os.wAction('journey', 'minimize'); }}>_</button>
                  <button className="win-btn" aria-hidden="true" tabIndex={-1}>□</button>
                  <button className="win-btn win-close" aria-label="Close Training Monitor"
                    onClick={() => { playClick(); os.wAction('journey', 'close'); }}>✕</button>
                </div>
              </div>

              <div className="jn-menubar">
                <span>File</span><span>View</span><span>Run</span><span>Help</span>
                <span className="jn-menu-spacer" />
                <span className="jn-run">
                  <span className="jn-run-dot" />
                  epoch {cur.ep} / {EPOCHS.length}
                </span>
              </div>

              <div className="jn-body">

                {/* ── LEFT 65% — the epoch carousel ── */}
                <div className="jn-stage">
                  <div className="jn-panel-hd">
                    <span className="jn-tw">▼</span>Training log
                    <span className="jn-hd-sp" />
                    <span className="jn-hd-meta">{cur.date}</span>
                  </div>

                  <div className="jn-pips">
                    {EPOCHS.map((e, i) => (
                      <button key={e.ep}
                        className={`jn-pip${i === live ? ' jn-pip-live' : ''}${i < live ? ' jn-pip-done' : ''}`}
                        onClick={() => jumpTo(i)}
                        aria-label={`Jump to epoch ${e.ep} — ${e.title}`} />
                    ))}
                  </div>

                  <div className="jn-reel">
                    {EPOCHS.map((e, i) => {
                      const d = i - live;
                      const y = d === 0 ? 0 : d < 0 ? -52 + d * 8 : 52 + d * 8;
                      return (
                        <article key={e.ep}
                          className={`jn-card${d === 0 ? ' jn-card-live' : ''}`}
                          style={{ '--jn-y': `${y}px`, '--jn-o': d === 0 ? 1 : 0, '--jn-b': d === 0 ? '0px' : '3px' }}
                          aria-hidden={d !== 0}>
                          <div className="jn-c-hd">
                            EPOCH {e.ep}<span className="jn-c-tag">{e.tag}</span>
                          </div>
                          <div className="jn-c-bd">
                            <div className="jn-c-top">
                              <span className="jn-c-ttl">{e.title}</span>
                              <span className="jn-c-date">{e.date}</span>
                            </div>
                            <div className="jn-c-where">{e.where}</div>
                            <div className="jn-c-rows">
                              {e.rows.map(([k, val]) => (
                                <div className="jn-c-row" key={k}>
                                  <span className="jn-c-k">{k}</span>
                                  <span className="jn-c-v">{renderB(val)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="jn-c-foot">
                              <span>epoch {e.ep} / {EPOCHS.length}</span>
                              <span className="jn-c-loss">
                                loss <b className="jn-c-loss-num"
                                  key={d === 0 ? `live-${live}` : 'idle'}>{EP_LOSS[i]}</b>{i > 0 ? ' ▼' : ''}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {/* ── RIGHT 35% — the loss curve ── */}
                <div className="jn-plotwrap">
                  <div className="jn-panel-hd">
                    <span className="jn-tw">▼</span>model loss
                    <span className="jn-hd-sp" />
                    <span className="jn-hd-meta">train · val</span>
                  </div>
                  <LossPlot prog={prog} live={live} reduced={os.reducedMotion} />
                  <div className="jn-readout">
                    <div className="jn-ro-row">
                      <span className="jn-ro-k">loss</span>
                      <span className="jn-ro-v">{EP_LOSS[live]}</span>
                    </div>
                    <div className="jn-ro-row">
                      <span className="jn-ro-k">status</span>
                      <span className="jn-ro-v jn-ro-st">{status}</span>
                    </div>
                    <div className="jn-ro-bar"><i style={{ transform: `scaleX(${pct / 100})` }} /></div>
                  </div>
                </div>

              </div>

              <div className="jn-statusbar">
                <span className="jn-sb">EPOCH <b>{cur.ep}</b></span>
                <span className="jn-sb jn-sb-grow">
                  {prog >= 1
                    ? 'Run complete — loss still descending · seeking placement 2026–27'
                    : prog > 0 ? cur.title : 'Ready — scroll to run'}
                </span>
                <span className="jn-sb jn-sb-hide">LOSS <b>{EP_LOSS[live]}</b></span>
                <span className="jn-sb"><b>{pct}%</b></span>
              </div>
            </div>
            )}

            {winCtl && !state.open && (
              <button className="sec-relaunch"
                onClick={() => { playClick(); os.wAction('journey', 'open'); }}>
                training_monitor.exe — relaunch ▸
              </button>
            )}

            <button className="jn-next" onClick={goNext}>
              <span>06 · Ask Shrey AI</span><span className="jn-next-arw">▼</span>
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}