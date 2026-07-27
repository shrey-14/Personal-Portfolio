/**
 * CRTBootAnimation.jsx  (v3 — grey BIOS theme + vector logo reveal)
 *
 * PHASE 1 — CRT power-on + Award/Phoenix-style GREY boot sequence
 *   · warm-up line → vertical bloom → typed POST log (light grey on black)
 *   · fixed footer pinned below the scroll: "Press SPACE or ESC to skip"
 *     (SPACE / ESC highlighted white) + a "{DATE}-{UNIQUE PC ID}" line
 *
 * PHASE 2 — SHREY/OS logo reveal + startup chime
 *   · a VECTOR monogram is traced stroke-by-stroke, as if drawn by the CRT's
 *     electron beam, then blooms to full brightness in sync with the chime
 *   · single smooth iris/CRT-gate transition hands off to the hero (the old
 *     "two lines splitting / rejoining" pair has been replaced)
 *
 * Audio: browsers block sound until the first user gesture. A one-time global
 * primer (see primeAudio / ensureAudioPrimed) unlocks the AudioContext on the
 * first pointer/key/scroll so the chime — and your hero sounds — fire reliably.
 *
 * Usage:  <CRTBootAnimation onComplete={() => setBooted(true)} />
 * Fonts:  "IBM Plex Mono" (boot log), "Press Start 2P" (logo wordmark).
 */

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Math helpers ─────────────────────────────────────────────────────────────
const lerp      = (a, b, t) => a + (b - a) * t;
const clamp     = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeOut   = (t) => 1 - (1 - t) * (1 - t);
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// ─── Seeded PRNG ──────────────────────────────────────────────────────────────
function prng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Fixed-footer strings (date + a stable per-session "PC ID") ───────────────
function makePcId() {
  // e.g. i440FX-7F3A9C — vintage-chipset prefix + random hex, matching the
  // "12/10/97-i430VX,UMC8669-2A59GH2BC-00" style of a real BIOS date line.
  const chips = ["i430VX", "i440FX", "i815EP", "SiS530", "VIA694"];
  const chip  = chips[Math.floor(Math.random() * chips.length)];
  const hex   = Array.from({ length: 6 },
    () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
  return `${chip}-2A59GH-${hex}`;
}
function makeDateStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

/* ── BIOS GREY PALETTE ─────────────────────────────────────────────────────────
   Authentic Award/Phoenix boot look: light-grey text on black, with a slightly
   brighter "hot" grey for the warm-up beam and highlighted keywords, and a dim
   grey for unfilled/vignette. One place to retune the whole screen.          */
const GREY        = [200, 200, 200];     // #C8C8C8 core text grey
const GREY_HOT    = [235, 235, 235];     // near-white beam / emphasis
const GREY_DIM    = [120, 120, 120];     // dim structure
const cssGrey     = (a = 1) => `rgba(212,212,212,${a})`;
const cssGreyHot  = (a = 1) => `rgba(244,244,244,${a})`;
const cssWhite    = (a = 1) => `rgba(255,255,255,${a})`;

// ─── Boot text (amber POST log) ───────────────────────────────────────────────
const BOOT_LINES = [
  "SHREY/OS v1.0  [BIOS 1.02.19]",
  "Copyright (C) 1991 SHREY SYSTEMS INC.",
  "",
  "Performing Power-On Self Test...",
  "CPU: SHREY-486 DX2/66  ..............  [ OK ]",
  "Memory Test: 640K  ..................  [ OK ]",
  "Extended Memory: 384K  ..............  [ OK ]",
  "Shadow RAM: Enabled  ................  [ OK ]",
  "CMOS Battery  .......................  [ OK ]",
  "Keyboard Controller  ................  [ OK ]",
  "Hard Disk Controller  ...............  [ OK ]",
  "",
  "Initialising display adapter...",
  "VGA 640x480 @ 256 colours detected.",
  "Sound Card: SHREY-SB16  .............  [ OK ]",
  "Network Adapter: SHREY-NE2000  ......  [ OK ]",
  "",
  "Loading SHREY/OS kernel  ............  [ OK ]",
  "Mounting root filesystem  ...........  [ OK ]",
  "",
  "Initialising core subsystems...",
  "neural.interface  ...................  [ OK ]",
  "creative.engine  ....................  [ OK ]",
  "logic.processor  ....................  [ OK ]",
  "",
  "Loading skill modules...",
  "  >> Python, JS, TypeScript  ........  [ OK ]",
  "  >> React, Node.js, Three.js  ......  [ OK ]",
  "  >> Machine Learning, AI/LLM  ......  [ OK ]",
  "  >> UI/UX Design, Figma  ...........  [ OK ]",
  "",
  "Indexing project archive...",
  "project.archive  ....................  [ OK ]",
  "ai.subsystems  ......................  [ OK ]",
  "network.stack  ......................  [ OK ]",
  "",
  "Calibrating neural pathways  ........  [ OK ]",
  "Syncing knowledge base  .............  [ OK ]",
  "Loading user profile  ...............  [ OK ]",
  "",
  "SHREY/OS SYSTEM BOOT COMPLETE.",
  "Starting SHREY/OS...",
];

const TOTAL_CHARS = BOOT_LINES.reduce((a, l) => a + l.length + 1, 0);

// ─── Timeline constants (seconds) ────────────────────────────────────────────
const BOOT_DUR      = 6.0;    // power-on + typing window
const HOLD_AFTER     = 0.5;   // brief pause after the log fills before the logo

// Phase 2 — vector logo reveal
const LOGO_TRACE_DUR = 1.5;   // electron-beam stroke-by-stroke tracing
const LOGO_BLOOM_DUR = 0.6;   // charge-up to full brightness (chime peak)
const LOGO_HOLD_DUR  = 1.2;   // hold on the fully-lit logo

// Single CRT-gate handoff to the hero (replaces the split/rejoin line pair)
const GATE_DUR       = 0.85;  // iris + brightness pull → fade to desktop teal

// ─── Audio: shared context + one-time unlock ──────────────────────────────────
// Browsers suspend audio until the first user gesture — this is a hard rule, not
// a bug. We create ONE shared AudioContext and resume it on the first pointer /
// key / scroll / touch anywhere on the page. After that, the boot chime and all
// hero sounds play freely. Export ensureAudioPrimed so the hero can share the
// exact same context (so its sounds are unlocked by the same first gesture).
let _audioCtx = null;
let _primed   = false;

export function getAudioContext() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (_) { _audioCtx = null; }
  }
  return _audioCtx;
}

export function ensureAudioPrimed() {
  if (_primed) return;
  _primed = true;
  const unlock = () => {
    const ac = getAudioContext();
    if (ac && ac.state === "suspended") ac.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("wheel", unlock);
    window.removeEventListener("scroll", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown",     unlock, { once: true });
  window.addEventListener("touchstart",  unlock, { once: true, passive: true });
  window.addEventListener("wheel",       unlock, { once: true, passive: true });
  window.addEventListener("scroll",      unlock, { once: true, passive: true });
  // Attempt an immediate resume too — succeeds if the context is already allowed
  // (e.g. the visitor already interacted before the boot mounted).
  const ac = getAudioContext();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

// ─── Startup chime (Web Audio, no files) ──────────────────────────────────────
function playStartupChime() {
  const ac = getAudioContext();
  if (!ac) return;
  if (ac.state === "suspended") { ac.resume().catch(() => {}); }
  try {
    const now = ac.currentTime;
    const master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0002, now + 2.4);

    const notes = [
      { f: 329.63, t: 0.00 },  // E4
      { f: 415.30, t: 0.14 },  // G#4
      { f: 493.88, t: 0.28 },  // B4
      { f: 659.25, t: 0.42 },  // E5 (peak — sync with logo bloom)
    ];
    notes.forEach(({ f, t }) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "triangle"; o.frequency.value = f;
      o.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.6, now + t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0002, now + t + 1.8);
      o.start(now + t); o.stop(now + t + 1.9);
    });
    const pad = ac.createOscillator(), pg = ac.createGain();
    pad.type = "sine"; pad.frequency.value = 164.81; // E3
    pad.connect(pg); pg.connect(master);
    pg.gain.setValueAtTime(0.0001, now);
    pg.gain.exponentialRampToValueAtTime(0.35, now + 0.1);
    pg.gain.exponentialRampToValueAtTime(0.0002, now + 2.3);
    pad.start(now); pad.stop(now + 2.4);
  } catch (_) { /* visuals still play */ }
}

// ─── A short "beam" tick used while the logo traces (subtle) ──────────────────
function playTraceTick() {
  const ac = getAudioContext();
  if (!ac || ac.state === "suspended") return;
  try {
    const now = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "square"; o.frequency.value = 1400;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.02, now);
    g.gain.exponentialRampToValueAtTime(0.0002, now + 0.05);
    o.start(now); o.stop(now + 0.06);
  } catch (_) {}
}

// ─── Canvas utilities ─────────────────────────────────────────────────────────
function chromAb(d, w, h, off) {
  if (!off) return;
  const tmp = new Uint8ClampedArray(d.length);
  for (let i = 0; i < d.length; i++) tmp[i] = d[i];
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const di  = (py * w + px) * 4;
      d[di]     = tmp[(py * w + clamp(px + off, 0, w - 1)) * 4];
      d[di + 2] = tmp[(py * w + clamp(px - off, 0, w - 1)) * 4 + 2];
    }
  }
}

function applyGrainRaw(d, w, h, seed, strength) {
  const rng = prng(seed ^ 0xDEAD);
  for (let i = 0; i < d.length; i += 4) {
    const g  = (rng() - 0.5) * 2 * 255 * strength;
    d[i]     = clamp(d[i]     + g, 0, 255);
    d[i + 1] = clamp(d[i + 1] + g, 0, 255);
    d[i + 2] = clamp(d[i + 2] + g, 0, 255);
  }
}

function drawGlass(ctx, W, H) {
  const g = ctx.createLinearGradient(W * 0.04, H * 0.04, W * 0.46, H * 0.44);
  g.addColorStop(0,   "rgba(255,255,255,0.045)");
  g.addColorStop(0.5, "rgba(255,255,255,0.012)");
  g.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ─── SHREY/OS cursor-S logo ─────────────────────────────────────────────────
// The real brand mark: a terminal cursor bracket + a bitmap "S" + a blinking
// amber caret. On boot it draws itself the way a CRT electron beam would —
// the bracket strokes in, then the S paints on pixel-by-pixel in reading order,
// then the amber caret blinks alive last.
//
// Everything is defined in a normalised 0..1 box (x right, y down) that matches
// the exported SVG (grid origin, 5x7 S cells, caret to the right of the S).
// Layout mirrors shreyos-icon.svg: S grid origin (196,118) cell 44 in a 512 box.
const _n = (v) => v / 512;   // px-in-512 → normalised

// Cursor bracket: three bars (left, top stub, bottom stub) as filled rects.
const LOGO_BRACKET = [
  { x: _n(140), y: _n(104), w: _n(16), h: _n(304) },   // left bar
  { x: _n(140), y: _n(104), w: _n(70), h: _n(16)  },   // top stub
  { x: _n(140), y: _n(392), w: _n(70), h: _n(16)  },   // bottom stub
];

// Bitmap "S" cells (44px cells at origin 196,118), already in reading order
// (top row L→R, then down) so the beam paints a believable S.
const LOGO_S_CELLS = [
  [240,118],[284,118],[328,118],[372,118],
  [196,162],[240,162],
  [196,206],[240,206],
  [240,250],[284,250],[328,250],
  [328,294],[372,294],
  [328,338],[372,338],
  [196,382],[240,382],[284,382],[328,382],
].map(([x, y]) => ({ x: _n(x), y: _n(y), w: _n(44), h: _n(44) }));

// The blinking amber caret (right of the S bottom row).
const LOGO_CARET = { x: _n(384), y: _n(382), w: _n(32), h: _n(44) };

// The logo art is centred on this normalised box centre so we can place it.
const LOGO_BOX_CX = _n((140 + 416) / 2);   // ≈ 0.543
const LOGO_BOX_CY = _n((104 + 426) / 2);   // ≈ 0.518

// Draw the cursor-S logo, revealing it by progress p (0..1):
//   0.00–0.30  bracket strokes in (left→top→bottom)
//   0.30–1.00  S cells paint on in reading order, a bright beam-head on the
//              cell currently lighting up
// `lit` (0..1) drives overall glow; `caretOn` shows/blinks the amber caret.
// (cx,cy) is the screen centre for the logo; `size` its full box width in px.
function drawCursorLogo(ctx, cx, cy, size, p, lit, caretOn, greyFill, hotFill, amberFill) {
  // Map normalised art coords so the art box centre (LOGO_BOX_CX/CY) lands at
  // (cx,cy) on screen, scaled by `size`.
  const X = (nx) => cx + (nx - LOGO_BOX_CX) * size;
  const Y = (ny) => cy + (ny - LOGO_BOX_CY) * size;
  const S_ = (nv) => nv * size;

  const bracketP = clamp(p / 0.30, 0, 1);
  const sP       = clamp((p - 0.30) / 0.70, 0, 1);

  // ── Bracket (draw the 3 bars, each wiping in along its long axis) ──
  ctx.shadowColor = greyFill;
  ctx.fillStyle   = greyFill;
  const barReveal = [
    clamp(bracketP / 0.5, 0, 1),                 // left bar (0–0.5)
    clamp((bracketP - 0.4) / 0.3, 0, 1),         // top stub
    clamp((bracketP - 0.6) / 0.4, 0, 1),         // bottom stub
  ];
  LOGO_BRACKET.forEach((b, i) => {
    const r = barReveal[i];
    if (r <= 0) return;
    ctx.shadowBlur = S_(0.008) * (0.4 + lit);
    if (b.h > b.w) {
      const hh = S_(b.h) * r;                     // vertical bar grows down
      ctx.fillRect(X(b.x), Y(b.y), S_(b.w), hh);
    } else {
      const ww = S_(b.w) * r;                     // horizontal stub grows right
      ctx.fillRect(X(b.x), Y(b.y), ww, S_(b.h));
    }
  });
  ctx.shadowBlur = 0;

  // ── S cells paint on in reading order ──
  const total = LOGO_S_CELLS.length;
  const shown = sP * total;
  const fullCount = Math.floor(shown);
  const partial = shown - fullCount;

  for (let i = 0; i < total; i++) {
    if (i > fullCount) break;
    const c = LOGO_S_CELLS[i];
    const isHead = (i === fullCount);
    const a = isHead ? partial : 1;
    if (a <= 0) continue;

    // The head cell "charges up" (scales from centre + brighter) as it lights.
    ctx.fillStyle  = isHead ? hotFill : greyFill;
    ctx.shadowBlur = S_(0.02) * (isHead ? 1 : 0.4 + lit);
    ctx.shadowColor = isHead ? hotFill : greyFill;
    const cw = S_(c.w), ch = S_(c.h);
    const cxp = X(c.x), cyp = Y(c.y);
    if (isHead) {
      const s = 0.35 + 0.65 * partial;            // grows in
      const iw = cw * s, ih = ch * s;
      ctx.fillRect(cxp + (cw - iw) / 2, cyp + (ch - ih) / 2, iw, ih);
    } else {
      ctx.fillRect(cxp, cyp, cw, ch);
    }
  }
  ctx.shadowBlur = 0;

  // ── Amber caret (blinks in once the S is essentially done) ──
  if (caretOn && sP > 0.9) {
    ctx.fillStyle  = amberFill;
    ctx.shadowBlur = S_(0.03);
    ctx.shadowColor = amberFill;
    ctx.fillRect(X(LOGO_CARET.x), Y(LOGO_CARET.y), S_(LOGO_CARET.w), S_(LOGO_CARET.h));
    ctx.shadowBlur = 0;
  }
}

// ─── CRT-gate handoff: single iris contraction + bloom → fade to desktop teal ──
// Replaces the old collapse→snap→flash pair. The frozen frame contracts toward
// centre (both axes) with a brightness swell, then dissolves into the SHREY/OS
// teal — one continuous gesture, no bookending line animation.
function drawGate(ctx, W, H, S, gateT) {
  if (!S.freezeCanvas) {
    const fc = document.createElement("canvas");
    fc.width = W; fc.height = H;
    fc.getContext("2d").drawImage(ctx.canvas, 0, 0);
    S.freezeCanvas = fc;
  }
  const p = clamp(gateT / GATE_DUR, 0, 1);
  const e = easeInOut(p);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // 1) Frozen frame irises inward (scales down toward centre) and fades.
  const scale = lerp(1, 0.72, e);
  const dw = W * scale, dh = H * scale;
  const dx = (W - dw) / 2, dy = (H - dh) / 2;
  ctx.globalAlpha = 1 - easeOut(p);
  ctx.drawImage(S.freezeCanvas, dx, dy, dw, dh);
  ctx.globalAlpha = 1;

  // 2) A soft central bloom swells then releases (the CRT "gate").
  const bloom = Math.sin(p * Math.PI) * 0.9;
  if (bloom > 0.01) {
    const cx = W / 2, cy = H / 2;
    const r = Math.max(2, W * (0.10 + e * 0.5));
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, cssWhite(bloom));
    g.addColorStop(0.5, `rgba(200,230,230,${bloom * 0.4})`);
    g.addColorStop(1, "rgba(27,30,36,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // 3) Cross-dissolve to the SHREY/OS desktop teal (#008080).
  const charcoalA = easeOut(clamp((p - 0.5) / 0.5, 0, 1));
  ctx.fillStyle = `rgba(27,30,36,${charcoalA})`;
  ctx.fillRect(0, 0, W, H);

  if (p >= 1) S.animDone = true;
}

// ─── PHASE 2: SHREY/OS vector logo reveal ──────────────────────────────────────
function drawLogoReveal(ctx, W, H, S, logoT) {
  const fontReady = S.fontReady;

  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, "#0a0a0a");
  bg.addColorStop(1, "#000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cyLogo = H * 0.42;
  const isSmallScreen = W < 480;
  // Full logo box width; the cursor-S art fills most of it.
  const size = Math.max(isSmallScreen ? 110 : 120, Math.min(H * 0.40, W * 0.30));

  const traceP = clamp(logoT / LOGO_TRACE_DUR, 0, 1);
  const bloomP = clamp((logoT - LOGO_TRACE_DUR) / LOGO_BLOOM_DUR, 0, 1);

  if (!S.chimeFired && logoT >= LOGO_TRACE_DUR - 0.30) {
    S.chimeFired = true;
    playStartupChime();
  }
  // Beam ticks as the S paints on (one per cell region).
  const tickIdx = Math.floor(traceP * 12);
  if (traceP < 1 && tickIdx !== S.lastTick) { S.lastTick = tickIdx; playTraceTick(); }

  const lit = bloomP > 0
    ? Math.min(1, 0.6 + Math.sin(easeOut(bloomP) * Math.PI * 0.5) * 0.4)
    : lerp(0.25, 0.7, traceP);
  const settle = bloomP >= 1 ? 0.9 + Math.sin(logoT * 3) * 0.06 : lit;

  // Caret blinks once the S is essentially drawn (during bloom + hold).
  const caretBlink = bloomP <= 0 ? false : (Math.floor((logoT) * 2) % 2 === 0);

  drawCursorLogo(
    ctx, cx, cyLogo, size,
    // While tracing, p = traceP*... maps to 0..1 of the logo reveal; after
    // tracing completes we hold at 1 (fully drawn) through the bloom.
    traceP < 1 ? traceP : 1,
    settle,
    caretBlink,
    cssGrey(lerp(0.5, 0.95, settle)),   // grey fill (S + bracket)
    cssWhite(0.98),                      // hot beam-head cell
    `rgba(232,144,32,${0.85 + 0.15 * settle})`  // amber caret (#E89020)
  );

  if (bloomP > 0) {
    const b = Math.sin(bloomP * Math.PI) * 0.5 + bloomP * 0.2;
    const g = ctx.createRadialGradient(cx, cyLogo, 0, cx, cyLogo, size * 0.9);
    g.addColorStop(0, `rgba(230,230,230,${b * 0.30})`);
    g.addColorStop(1, "rgba(200,200,200,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  if (bloomP > 0.1) {
    const sa = clamp((bloomP - 0.1) / 0.6, 0, 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // The cursor-S art fills its box, so place the wordmark below the box's
    // bottom edge (box half-height ≈ size*0.42) with a comfortable gap.
    const wmY  = cyLogo + size * 0.60;
    const wmFs = Math.max(isSmallScreen ? 15 : 16, Math.round(size * 0.17));   // ↑ slightly larger
    ctx.font = `${wmFs}px ${fontReady ? '"Press Start 2P"' : "monospace"}`;
    ctx.shadowBlur  = wmFs * 0.35 * sa;                    // ↓ tighter glow → crisper
    ctx.shadowColor = cssGrey(0.55 * sa);
    ctx.fillStyle   = cssGreyHot(0.98 * sa);
    ctx.fillText("SHREY/OS", cx, wmY);
    ctx.shadowBlur  = 0;

    // Subtitle in a legible mono (IBM Plex Mono) rather than chunky pixels —
    // small pixel type blurs; this keeps the tagline crisp and readable.
    const subFs = Math.max(isSmallScreen ? 10 : 11, Math.round(size * 0.085));
    ctx.font = `${subFs}px ${S.bootFontReady ? '"IBM Plex Mono","Courier New",monospace' : '"Courier New",monospace'}`;
    ctx.fillStyle = cssGrey(0.62 * sa);
    ctx.fillText("PORTFOLIO SYSTEM  ·  v1.0", cx, wmY + wmFs * 1.7);
  }

  for (let sy = 0; sy < H; sy += 2) {
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, sy, W, 1);
  }
  drawGlass(ctx, W, H);
}

// ─── PHASE 1: boot frame renderer (grey) ────────────────────────────────────────
function drawBootFrame(ctx, t, W, H, S) {
  const breathe = 1 + Math.sin(t * Math.PI) * 0.03;
  const flicker = 1 + Math.sin(t * (10 + Math.sin(t * 7.3) * 2) * Math.PI * 2) * 0.28;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (t < 0.30) return;

  const img = ctx.createImageData(W, H);
  const d   = img.data;
  const rng = prng(Math.floor(t * 24) ^ 0xBEEF);

  // ── Horizontal warm-up line ───────────────────────────────────────────────
  if (t < 0.75) {
    const lt  = clamp((t - 0.30) / 0.45, 0, 1);
    const lp  = easeOut(lt);
    const fl  = t > 0.32 ? flicker : 1;
    const cy  = Math.floor(H / 2);
    for (let px = 0; px < W; px++) {
      const dc  = Math.abs(px - W / 2) / (W / 2);
      if (dc > lp) continue;
      const str = clamp(lp - dc, 0, 1) * fl;
      for (let dy = -18; dy <= 18; dy++) {
        const py = cy + dy;
        if (py < 0 || py >= H) continue;
        const t2 = Math.abs(dy) / 18;
        const bl = Math.exp(-t2 * t2 * 3.5) * str;
        const i  = (py * W + px) * 4;
        d[i]     = clamp(d[i]     + lerp(GREY_HOT[0], GREY[0], t2) * bl, 0, 255);
        d[i + 1] = clamp(d[i + 1] + lerp(GREY_HOT[1], GREY[1], t2) * bl, 0, 255);
        d[i + 2] = clamp(d[i + 2] + lerp(GREY_HOT[2], GREY[2], t2) * bl, 0, 255);
        d[i + 3] = 255;
      }
    }
    applyGrainRaw(d, W, H, S.frame, 0.10);
    ctx.putImageData(img, 0, 0);
    drawGlass(ctx, W, H);
    return;
  }

  // ── Vertical expansion + brightness overshoot ─────────────────────────────
  if (t < 1.75) {
    const et    = clamp((t - 0.75) / 0.65, 0, 1);
    const exp   = easeInOut(et);
    const cy    = H / 2;
    const halfH = cy * exp;
    let ob = 1, co = Math.round(exp * 1.5);
    if (t >= 1.40) {
      const ot = clamp((t - 1.40) / 0.35, 0, 1);
      const bm = Math.sin(ot * Math.PI);
      ob = 1 + bm * 3.8;
      co = Math.round(bm * 6);
    }
    for (let py = 0; py < H; py++) {
      const dist = Math.abs(py - cy);
      const sl   = py % 2 === 0 ? 1 : 0.62;
      const vy   = (py / H) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const vx  = (px / W) * 2 - 1;
        const vig = clamp(1 - (vx * vx + vy * vy) * 1.3, 0, 1);
        const i   = (py * W + px) * 4;
        if (dist > halfH) {
          const ef = clamp((halfH + 14 - dist) / 14, 0, 1);
          if (ef > 0) {
            d[i]     = clamp(GREY[0] * ef * 0.5, 0, 255);
            d[i + 1] = clamp(GREY[1] * ef * 0.5, 0, 255);
            d[i + 2] = clamp(GREY[2] * ef * 0.5, 0, 255);
            d[i + 3] = 255;
          }
          continue;
        }
        const n  = rng();
        const ef = clamp((halfH - dist) / (H * 0.06 + 4), 0, 1);
        const br = ob * breathe * sl * vig * ef;
        d[i]     = clamp(lerp(0x30, 0x50, n) * br, 0, 255);
        d[i + 1] = clamp(lerp(0x30, 0x50, n) * br, 0, 255);
        d[i + 2] = clamp(lerp(0x30, 0x50, n) * br, 0, 255);
        d[i + 3] = 255;
      }
    }
    if (co > 0) chromAb(d, W, H, co);
    applyGrainRaw(d, W, H, S.frame, 0.10);
    ctx.putImageData(img, 0, 0);
    drawGlass(ctx, W, H);
    return;
  }

  // ── Text / steady-state phase ─────────────────────────────────────────────
  const textT0     = clamp((t - 1.75) / 3.0, 0, 1);
  const charsShow0 = Math.floor(easeOut(textT0) * TOTAL_CHARS * 1.05);
  if (S.typeDoneAt == null && charsShow0 >= TOTAL_CHARS) S.typeDoneAt = t;

  // Once typed + a brief hold, hand off to the logo reveal (phase 2), then gate.
  if (S.typeDoneAt != null) {
    const holdT = t - S.typeDoneAt;
    if (holdT >= HOLD_AFTER) {
      const logoT = holdT - HOLD_AFTER;
      const logoTotal = LOGO_TRACE_DUR + LOGO_BLOOM_DUR + LOGO_HOLD_DUR;
      if (logoT < logoTotal) {
        drawLogoReveal(ctx, W, H, S, logoT);
      } else {
        drawGate(ctx, W, H, S, logoT - logoTotal);
      }
      return;
    }
  }

  // Dark neutral background wash (very faint grey glow, mostly black)
  for (let py = 0; py < H; py++) {
    const sl  = py % 2 === 0 ? 1 : 0.65;
    const vy  = (py / H) * 2 - 1;
    for (let px = 0; px < W; px++) {
      const vx  = (px / W) * 2 - 1;
      const vig = clamp(1 - (vx * vx + vy * vy) * 1.4, 0, 1);
      const n   = rng() * 0.6;
      const br  = sl * vig * breathe * 0.35;
      const i   = (py * W + px) * 4;
      const v   = lerp(0x12, 0x1E, n) * br;
      d[i]     = clamp(v, 0, 255);
      d[i + 1] = clamp(v, 0, 255);
      d[i + 2] = clamp(v, 0, 255);
      d[i + 3] = 255;
    }
  }

  // Interference sweep line (neutral)
  if (!S.sweepActive && t >= 2.95) { S.sweepActive = true; S.sweepY = 0; }
  if (S.sweepActive) {
    S.sweepY += H * 0.022;
    if (S.sweepY > H) S.sweepActive = false;
    else {
      for (let px = 0; px < W; px++) {
        for (let dd = -5; dd <= 5; dd++) {
          const spy = Math.floor(S.sweepY) + dd;
          if (spy < 0 || spy >= H) continue;
          const fv = 1 - Math.abs(dd) / 6;
          const i  = (spy * W + px) * 4;
          d[i]     = clamp(d[i]     + 42 * fv, 0, 255);
          d[i + 1] = clamp(d[i + 1] + 42 * fv, 0, 255);
          d[i + 2] = clamp(d[i + 2] + 42 * fv, 0, 255);
        }
      }
    }
  }

  chromAb(d, W, H, 1);
  applyGrainRaw(d, W, H, S.frame, 0.06);
  ctx.putImageData(img, 0, 0);

  // ── Typed boot text (scrolling terminal) ──────────────────────────
  const charsShow = charsShow0;
  const isSmallScreen = W < 480;
  const fsFromH   = H * 0.031;                       // ↑ from 0.030 (bigger)
  const fsFromW   = (W * 0.90) / (49 * 0.60);        // a touch wider budget
  const fsMult    = isSmallScreen ? 1.00 : 1.15;      // shrink a bit on small screens so lines fit
  const fsFloor   = isSmallScreen ? 10 : 11;
  const fs        = Math.max(fsFloor, Math.round(Math.min(fsFromH, fsFromW) * fsMult));
  const lh        = Math.round(fs * 1.58);
  const padX      = Math.round(W * 0.06) + S.jX;
  const padY      = Math.round(H * 0.10) + fs;
  const footerRes = Math.round(fs * 4.2);   // space reserved for the fixed footer
  const maxVisible = Math.max(4, Math.floor((H - footerRes - padY) / lh));

  let _cc = 0, cursorLine = 0;
  for (let li = 0; li < BOOT_LINES.length; li++) {
    if (_cc >= charsShow) break;
    cursorLine = li;
    _cc += BOOT_LINES[li].length + 1;
  }
  const scrollStart = Math.max(0, cursorLine - maxVisible + 1);

  ctx.font      = S.bootFontReady ? `${fs}px "IBM Plex Mono","Courier New",monospace` : `${fs}px "Courier New",monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let cc = 0;
  for (let li = 0; li < BOOT_LINES.length; li++) {
    const line = BOOT_LINES[li];
    let str = "";
    for (let ci = 0; ci < line.length; ci++) {
      if (cc >= charsShow) break;
      str += line[ci]; cc++;
    }
    cc++;
    if (li < scrollStart || li >= scrollStart + maxVisible) continue;
    if (!str) continue;

    const ly    = padY + (li - scrollStart) * lh;
    const sl    = ly % 2 === 0 ? 1 : 0.72;         // ↑ from 0.68 — less scanline dimming
    const vy    = (ly / H) * 2 - 1;
    const vig   = clamp(1 - vy * vy * 0.9, 0, 1);  // ↓ vignette falloff — edges stay legible
    const alpha = sl * vig * breathe;

    // Crisper text: a tight glow instead of a soft blur, and higher opacity.
    ctx.shadowBlur  = Math.round(fs * 0.18);        // ↓ from 0.5 — much sharper
    ctx.shadowColor = cssGrey(0.35);
    ctx.fillStyle   = cssGreyHot(clamp(alpha, 0, 1)); // brighter ink (hot grey)
    ctx.fillText(str, padX, ly);
    ctx.shadowBlur  = 0;
  }

  // Blinking block cursor on the last typed line
  if (cc >= TOTAL_CHARS - 2 && Math.floor(t * 2) % 2 === 0) {
    const lastLine   = BOOT_LINES.length - 1;
    const visibleRow = lastLine - scrollStart;
    if (visibleRow >= 0 && visibleRow < maxVisible) {
      const ly  = padY + visibleRow * lh;
      const cx2 = padX + ctx.measureText(BOOT_LINES[lastLine] + " ").width;
      ctx.shadowBlur  = Math.round(fs * 0.4);
      ctx.shadowColor = cssGrey(0.7);
      ctx.fillStyle   = cssGreyHot(0.95);
      ctx.fillRect(cx2, ly - fs * 0.88, fs * 0.52, fs * 0.92);
      ctx.shadowBlur  = 0;
    }
  }

  // ── FIXED FOOTER (pinned, does not scroll with the log) ──────────────────
  // Line 1: "Press SPACE or ESC to skip"  — SPACE/ESC in bright white.
  // Line 2: "{DATE}-{PC ID}"               — dim grey, BIOS date-line style.
  drawBootFooter(ctx, W, H, S, fs, padX);

  drawGlass(ctx, W, H);
}

// ─── Fixed footer renderer ─────────────────────────────────────────────────────
function drawBootFooter(ctx, W, H, S, baseFs, padX) {
  const fs = Math.max(W < 480 ? 8 : 9, Math.round(baseFs * 0.92));
  const font = S.bootFontReady ? `${fs}px "IBM Plex Mono","Courier New",monospace` : `${fs}px "Courier New",monospace`;
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const y1 = H - Math.round(fs * 3.0);   // skip line
  const y2 = H - Math.round(fs * 1.3);   // date / id line

  // Faint dark strip so the footer stays legible over any scrolled text —
  // then the same phosphor grain the rest of the tube gets, so the band no
  // longer reads as a dead flat-black rectangle.
  const bandY = y1 - fs * 1.3;
  const bandH = H - bandY;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, bandY, W, bandH);
  const grng = prng((S.frame | 0) ^ 0xF007);
  const specks = Math.max(240, Math.floor((W * bandH) / 900));
  for (let i = 0; i < specks; i++) {
    const gx = grng() * W, gy = bandY + grng() * bandH;
    const gv = grng();
    ctx.fillStyle = `rgba(${gv > 0.5 ? '90,92,96' : '10,10,12'},${0.18 + grng() * 0.2})`;
    ctx.fillRect(gx, gy, 1 + (gv > 0.85 ? 1 : 0), 1);
  }
  // subtle scanline rows across the band to match the frame above
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let sy = Math.ceil(bandY); sy < H; sy += 2) ctx.fillRect(0, sy, W, 1);

  // Line 1 — mixed colours: keywords SPACE / ESC bright white, rest dim grey.
  const seg = [
    { s: "Press ",  hot: false },
    { s: "SPACE",    hot: true  },
    { s: " or ",     hot: false },
    { s: "ESC",      hot: true  },
    { s: " to skip", hot: false },
  ];
  let x = padX;
  for (const p of seg) {
    ctx.fillStyle = p.hot ? cssWhite(0.96) : cssGrey(0.55);
    if (p.hot) { ctx.shadowBlur = fs * 0.4; ctx.shadowColor = cssWhite(0.5); }
    ctx.fillText(p.s, x, y1);
    ctx.shadowBlur = 0;
    x += ctx.measureText(p.s).width;
  }

  // Line 2 — date + unique PC id (dim), matching the BIOS date-line look.
  ctx.fillStyle = cssGrey(0.42);
  ctx.fillText(`${S.dateStr}-${S.pcId}`, padX, y2);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CRTBootAnimation({ onComplete, autoPlay = true }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    rafId: null, startTime: null, frame: 0, jX: 0, nextJF: 0,
    sweepY: -1, sweepActive: false,
    skipPressed: false, skipPressedAt: 0,
    fontReady: false, bootFontReady: false,
    typeDoneAt: null, chimeFired: false, lastTick: -1, freezeCanvas: null, animDone: false,
    dateStr: makeDateStr(), pcId: makePcId(),
  });

  const draw = useCallback((canvas, ctx, t) => {
    const S = stateRef.current;
    const W = canvas.width, H = canvas.height;
    S.frame++;

    if (S.frame >= S.nextJF) {
      S.jX     = (Math.random() - 0.5) * 1.0;
      S.nextJF = S.frame + 4 + Math.floor(Math.random() * 6);
    }

    // Skip → jump straight to the CRT-gate handoff.
    if (S.skipPressed) {
      const gateT = (performance.now() - S.skipPressedAt) / 1000;
      drawGate(ctx, W, H, S, gateT);
      return;
    }

    // Single phase: boot sequence (which hands off to logo reveal → gate).
    drawBootFrame(ctx, t, W, H, S);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const S   = stateRef.current;

    // Prime audio so the chime + hero sounds unlock on the first user gesture.
    ensureAudioPrimed();

    document.fonts.load('12px "Press Start 2P"').then(() => { S.fontReady = true; });
    document.fonts.load('12px "IBM Plex Mono"').then(() => { S.bootFontReady = true; });

    const resize = () => {
      const rect    = canvas.getBoundingClientRect();
      canvas.width  = Math.round(rect.width)  || 1;
      canvas.height = Math.round(rect.height) || 1;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const skip = () => {
      if (S.skipPressed || S.animDone) return;
      S.skipPressed   = true;
      S.skipPressedAt = performance.now();
      S.freezeCanvas  = null;   // freeze current frame for the gate
    };
    const onKey = (e) => { if (e.code === "Space" || e.code === "Escape") skip(); };
    document.addEventListener("keydown", onKey);
    canvas.addEventListener("click", skip);

    /* Reduced motion: the boot is exactly the class of flicker the preference
       exists for — hand off immediately, no tube warm-up, no scanlines. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = setTimeout(() => onComplete?.(), 0);
      return () => {
        clearTimeout(id);
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
        canvas.removeEventListener("click", skip);
      };
    }


    Object.assign(S, {
      startTime: null, frame: 0, jX: 0, nextJF: 0,
      sweepY: -1, sweepActive: false, skipPressed: false, skipPressedAt: 0,
      typeDoneAt: null, chimeFired: false, lastTick: -1, freezeCanvas: null, animDone: false,
    });

    // Safety fallback — real completion is driven by S.animDone.
    const totalSafety =
      BOOT_DUR + HOLD_AFTER +
      LOGO_TRACE_DUR + LOGO_BLOOM_DUR + LOGO_HOLD_DUR +
      GATE_DUR + 4;

    const loop = (ts) => {
      if (!S.startTime) S.startTime = ts;
      const t = (ts - S.startTime) / 1000;
      draw(canvas, ctx, t);
      const end = S.skipPressed
        ? (S.skipPressedAt - (S.startTime || S.skipPressedAt)) / 1000 + GATE_DUR + 1
        : totalSafety;
      if (!S.animDone && t < end) {
        S.rafId = requestAnimationFrame(loop);
      } else if (onComplete) {
        onComplete();
      }
    };

    if (autoPlay) S.rafId = requestAnimationFrame(loop);

    return () => {
      if (S.rafId) cancelAnimationFrame(S.rafId);
      ro.disconnect();
      document.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", skip);
    };
  }, [draw, onComplete, autoPlay]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block", width: "100%", height: "100%",
        background: "#000", imageRendering: "auto", cursor: "pointer",
      }}
      title="Click or press Space / ESC to skip"
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CRT SHUTDOWN — the boot sequence played in REVERSE, sharing this module's
   palette (GREY / GREY_HOT), grain (applyGrainRaw), glass, easings and text
   metrics so power-off is provably the same tube as power-on:

     boot:      beam grows (0.45s) → field expands from centreline (0.65s)
     shutdown:  log types → field COLLAPSES to centreline (0.65s)
                → beam SHRINKS to centre (0.45s) → dot afterglow → plate
   ════════════════════════════════════════════════════════════════════════════ */
const SD_LINES = [
  "Saving session state ...............  OK",
  "Closing 4 running programs .........  OK",
  "Unmounting A:\\PROJECTS\\ ............  OK",
  "Flushing render pipeline ...........  OK",
  "",
  "Thanks for scrolling. Let's talk.",
];
const SD_LOG_DUR   = 2.30;   // typed log
const SD_FIELD_DUR = 0.65;   // mirror of boot expansion 0.75→1.40
const SD_BEAM_DUR  = 0.45;   // mirror of boot beam 0.30→0.75
const SD_DOT_DUR   = 0.55;

function drawShutdownFrame(ctx, t, W, H, S) {
  const img = ctx.createImageData(W, H);
  const d   = img.data;
  const rng = prng(Math.floor(t * 24) ^ 0xDEAD);
  const flicker = 0.96 + rng() * 0.05;
  const breathe = 0.985 + Math.sin(t * 2.2) * 0.015;

  /* ── PHASE A: shutdown log — boot's own text metrics & inks ── */
  if (t < SD_LOG_DUR) {
    // faint grained wash, scanlines, vignette (same as boot's text phase)
    for (let py = 0; py < H; py++) {
      const sl = py % 2 === 0 ? 1 : 0.65;
      const vy = (py / H) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const vx  = (px / W) * 2 - 1;
        const vig = clamp(1 - (vx * vx + vy * vy) * 1.4, 0, 1);
        const n   = rng() * 0.6;
        const v   = lerp(0x12, 0x1e, n) * (sl * vig * breathe * 0.35);
        const i   = (py * W + px) * 4;
        d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 255);
        d[i + 3] = 255;
      }
    }
    applyGrainRaw(d, W, H, S.frame, 0.08);
    ctx.putImageData(img, 0, 0);

    // text — identical sizing rules to drawBootFrame
    const isSmallScreen = W < 480;
    const fsFromH = H * 0.031;
    const fsFromW = (W * 0.90) / (49 * 0.60);
    const fs  = Math.max(isSmallScreen ? 9 : 11, Math.round(Math.min(fsFromH, fsFromW) * (isSmallScreen ? 1.00 : 1.15)));
    const lh  = Math.round(fs * 1.58);
    const padX = Math.round(W * 0.06);
    const padY = Math.round(H * 0.16) + fs;
    ctx.font = S.fontReady
      ? `${fs}px "IBM Plex Mono","Courier New",monospace`
      : `${fs}px "Courier New",monospace`;
    ctx.textBaseline = 'alphabetic';

    // header
    ctx.shadowColor = cssGrey(0.35); ctx.shadowBlur = 6;
    ctx.fillStyle = cssGreyHot(0.95);
    ctx.fillText('SHREY/OS is shutting down...', padX, padY);

    // typed lines — chars stream at the boot's cadence
    const charsShow = Math.floor(clamp((t - 0.35) / (SD_LOG_DUR - 0.55), 0, 1)
      * SD_LINES.join('\n').length);
    let used = 0;
    SD_LINES.forEach((ln, i) => {
      if (used > charsShow) return;
      const take = Math.max(0, Math.min(ln.length, charsShow - used));
      used += ln.length;
      if (take <= 0) return;
      ctx.fillStyle = cssGreyHot(0.88);
      ctx.fillText(ln.slice(0, take), padX, padY + lh * (i + 2));
    });

    // block cursor
    if (Math.floor(t * 2.4) % 2 === 0) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = cssGreyHot(0.95);
      const doneLines = SD_LINES.length;
      ctx.fillRect(padX, padY + lh * (doneLines + 2) - fs + 2, fs * 0.55, fs);
    }
    ctx.shadowBlur = 0;
    drawGlass(ctx, W, H);
    return false;
  }

  /* ── PHASE B: field collapse — boot's vertical expansion, reversed ── */
  const tb = t - SD_LOG_DUR;
  if (tb < SD_FIELD_DUR) {
    const et    = clamp(tb / SD_FIELD_DUR, 0, 1);
    const exp   = 1 - easeInOut(et);            // 1 → 0 (boot ran 0 → 1)
    const cy    = H / 2;
    const halfH = cy * exp;
    // brightness swells as the picture compresses (the tube dumping charge)
    const ob = 1 + Math.sin(et * Math.PI) * 1.6;
    const co = Math.round(Math.sin(et * Math.PI) * 4);
    for (let py = 0; py < H; py++) {
      const dist = Math.abs(py - cy);
      const sl   = py % 2 === 0 ? 1 : 0.62;
      const vy   = (py / H) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const vx  = (px / W) * 2 - 1;
        const vig = clamp(1 - (vx * vx + vy * vy) * 1.3, 0, 1);
        const i   = (py * W + px) * 4;
        if (dist > halfH) {
          const ef = clamp((halfH + 14 - dist) / 14, 0, 1);
          if (ef > 0) {
            d[i]     = clamp(GREY[0] * ef * 0.5, 0, 255);
            d[i + 1] = clamp(GREY[1] * ef * 0.5, 0, 255);
            d[i + 2] = clamp(GREY[2] * ef * 0.5, 0, 255);
            d[i + 3] = 255;
          }
          continue;
        }
        const n  = rng();
        const ef = clamp((halfH - dist) / (H * 0.06 + 4), 0, 1);
        const br = ob * breathe * sl * vig * ef;
        const v  = lerp(0x30, 0x50, n) * br;
        d[i] = clamp(v, 0, 255); d[i + 1] = clamp(v, 0, 255); d[i + 2] = clamp(v, 0, 255);
        d[i + 3] = 255;
      }
    }
    if (co > 0) chromAb(d, W, H, co);
    applyGrainRaw(d, W, H, S.frame, 0.10);
    ctx.putImageData(img, 0, 0);
    drawGlass(ctx, W, H);
    return false;
  }

  /* ── PHASE C: beam shrink — boot's warm-up line, reversed ── */
  const tc = tb - SD_FIELD_DUR;
  if (tc < SD_BEAM_DUR) {
    const lt = clamp(tc / SD_BEAM_DUR, 0, 1);
    const lp = 1 - easeOut(lt);                 // full width → 0
    const cy = Math.floor(H / 2);
    for (let px = 0; px < W; px++) {
      const dc = Math.abs(px - W / 2) / (W / 2);
      if (dc > lp) continue;
      const str = clamp(lp - dc, 0, 1) * flicker;
      for (let dy = -18; dy <= 18; dy++) {
        const py = cy + dy;
        if (py < 0 || py >= H) continue;
        const t2 = Math.abs(dy) / 18;
        const bl = Math.exp(-t2 * t2 * 3.5) * str;
        const i  = (py * W + px) * 4;
        d[i]     = clamp(d[i]     + lerp(GREY_HOT[0], GREY[0], t2) * bl, 0, 255);
        d[i + 1] = clamp(d[i + 1] + lerp(GREY_HOT[1], GREY[1], t2) * bl, 0, 255);
        d[i + 2] = clamp(d[i + 2] + lerp(GREY_HOT[2], GREY[2], t2) * bl, 0, 255);
        d[i + 3] = 255;
      }
    }
    applyGrainRaw(d, W, H, S.frame, 0.10);
    ctx.putImageData(img, 0, 0);
    drawGlass(ctx, W, H);
    return false;
  }

  /* ── PHASE D: the dot — phosphor afterglow dying at centre ── */
  const td = tc - SD_BEAM_DUR;
  ctx.putImageData(img, 0, 0);                  // hard black
  if (td < SD_DOT_DUR) {
    const dt = clamp(td / SD_DOT_DUR, 0, 1);
    const a  = (1 - easeOut(dt));
    const r  = lerp(5, 1.2, dt);
    ctx.save();
    ctx.shadowColor = cssGreyHot(a);
    ctx.shadowBlur  = 26 * a + 6;
    ctx.fillStyle   = cssWhite(a);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawGlass(ctx, W, H);
    return false;
  }
  return true;                                   // fully dark → plate
}

export function CRTShutdownAnimation({ onRestart, playFx }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ startTime: null, frame: 0, fontReady: false, rafId: 0 });
  const [plate, setPlate] = useState(false);
  const fxFired = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const S = stateRef.current;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlate(true);
      return;
    }

    const ctx = canvas.getContext('2d');
    document.fonts?.load('12px "IBM Plex Mono"').then(() => { S.fontReady = true; });
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.round(rect.width)  || 1;
      canvas.height = Math.round(rect.height) || 1;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = ts => {
      if (!S.startTime) S.startTime = ts;
      const t = (ts - S.startTime) / 1000;
      S.frame++;
      if (!fxFired.current && t >= SD_LOG_DUR) { fxFired.current = true; playFx?.(); }
      const done = drawShutdownFrame(ctx, t, canvas.width, canvas.height, S);
      if (done) { setPlate(true); return; }
      S.rafId = requestAnimationFrame(loop);
    };
    S.rafId = requestAnimationFrame(loop);
    return () => { if (S.rafId) cancelAnimationFrame(S.rafId); ro.disconnect(); };
  }, [playFx]);

  return (
    <div className="sd-root" role="dialog" aria-label="Shutting down">
      {!plate && <canvas ref={canvasRef} className="sd-canvas" />}
      {plate && (
        <div className="sd-off">
          <div className="sd-plate">
            <div className="sd-plate-txt">It&rsquo;s now safe to close this tab.</div>
            <div className="sd-plate-sub">
              But the machine is still warm — Shrey is available for an
              AI/ML placement, 2026&ndash;27.
            </div>
            <div className="sd-actions">
              <button className="sd-btn sd-btn-primary" onClick={onRestart}>
                <img src="/icons/os/32/shutdown.png" alt="Restart" /> RESTART SHREY/OS
              </button>
              <a className="sd-btn" href="mailto:pshrey964@gmail.com">
                <img src="/icons/os/32/app-mail.png" alt="Email" /> PSHREY964@GMAIL.COM
              </a>
            </div>
          </div>
          <div className="sd-foot">SHREY/OS v2.0 · © 2026 SHREY PATEL</div>
        </div>
      )}
    </div>
  );
}

