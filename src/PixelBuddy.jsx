/* ═══════════════════════════════════════════════════════════════════════════
   PIXEL BUDDY — the tiny inhabitant of SHREY/OS
   ───────────────────────────────────────────────────────────────────────────
   72-frame sprite-driven character (pixel-art Shrey) reacting to what's
   happening ON THE SITE, not just to the clock. He watches your cursor,
   naps when you leave, waves when you arrive, points at what you open,
   types along with the mail terminal.

   TWELVE SPRITE SHEETS (all 384×256, six 128×128 frames in a 3×2 grid):
     hello-phase1  · hello-phase2   → 12-frame wave hello
     watch-phase1  · watch-phase2   → 12-frame watch check
     yawning       · sleeping       → wind-down + sleep loop
     typing                         → 6-frame typing loop
     panic                          → 6-frame panic (CSS adds the shake)
     dizziness                      → 6-frame dizzy spin
     direction                      → 6-frame point (R + L directions built-in)
     thinking      · thumb          → click reactions

   DESIGN GOAL — no frame ever plays alone. Every animation is a bracketed
   sequence with (a) an entry from idle, (b) a HOLD on the key pose so the
   viewer can register it, (c) an exit back to idle. That's what makes it
   read as animation and not a slideshow. Frame timings are tuned per
   sequence — motion frames are 90ms, hold frames 400–700ms, entry/exit
   easings are asymmetric (fast in, slow out) like real animation.

   SCROLL POSITIONING — the buddy anchors to WHERE ON THE PAGE he lives, not
   the viewport. He sits down-right of the Hero and stays with the section
   as you scroll. When a section calls for a reaction (Mail open → typing,
   Terminal focused → thinking, BSOD → panic), he scrolls into view and
   reacts, then returns to idle.

   INTEGRATION EVENTS — any component can dispatch these to make him react:
     'shreyos-buddy' details:
       { type: 'launch',   x?, y? }   → point toward a click target
       { type: 'panic'  }             → hands-to-head shake
       { type: 'type'   }             → typing loop (until 'stop')
       { type: 'think'  }             → thinking pose
       { type: 'stop'   }             → return to idle
═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useCallback } from 'react';

import sheetHello1  from './assets/pixel-buddy/hello-phase1.png';
import sheetHello2  from './assets/pixel-buddy/hello-phase2.png';
import sheetWatch1  from './assets/pixel-buddy/watch-phase1.png';
import sheetWatch2  from './assets/pixel-buddy/watch-phase2.png';
import sheetYawn    from './assets/pixel-buddy/yawning.png';
import sheetSleep   from './assets/pixel-buddy/sleeping.png';
import sheetType    from './assets/pixel-buddy/typing.png';
import sheetPanic   from './assets/pixel-buddy/panic.png';
import sheetDizzy   from './assets/pixel-buddy/dizziness.png';
import sheetPoint   from './assets/pixel-buddy/direction.png';
import sheetThink   from './assets/pixel-buddy/thinking.png';
import sheetThumb   from './assets/pixel-buddy/thumb.png';

/* ── SPRITE GEOMETRY ─────────────────────────────────────────────────────
   Native cells are 128×128 (sheet 384×256 = 3×2 grid). We render at 1.4×
   for a ~180px-tall buddy on desktop — big enough to see the expression,
   small enough that he lives comfortably at the edge of the taskbar.
──────────────────────────────────────────────────────────────────────── */
const FRAME_W = 128;
const FRAME_H = 128;
const SCALE   = 1.4;
const DW = Math.round(FRAME_W * SCALE);
const DH = Math.round(FRAME_H * SCALE);

/* Given a sheet + grid position (col 0-2, row 0-1), the exact
   background-position offset for CSS. */
const cell = (sheet, col, row) => ({
  sheet,
  x: -col * DW,
  y: -row * DH,
});

/* ── FRAME VOCABULARY ────────────────────────────────────────────────────
   Names describe *what the character is doing*, not "frame 3 of sheet 5".
   Every animation sequence below composes from this vocabulary.
──────────────────────────────────────────────────────────────────────── */
const F = {
  /* hello — arm going up (phase 1) */
  h1_idle:    cell(sheetHello1, 0, 0),
  h1_rise1:   cell(sheetHello1, 1, 0),
  h1_rise2:   cell(sheetHello1, 2, 0),
  h1_open:    cell(sheetHello1, 0, 1),
  h1_tilt1:   cell(sheetHello1, 1, 1),
  h1_tilt2:   cell(sheetHello1, 2, 1),
  /* hello — waving + coming down (phase 2) */
  h2_tilt3:   cell(sheetHello2, 0, 0),
  h2_hold:    cell(sheetHello2, 1, 0),
  h2_desc1:   cell(sheetHello2, 2, 0),
  h2_desc2:   cell(sheetHello2, 0, 1),
  h2_desc3:   cell(sheetHello2, 1, 1),
  h2_return:  cell(sheetHello2, 2, 1),

  /* watch — arm rising (phase 1) */
  w1_idle:    cell(sheetWatch1, 0, 0),
  w1_bend:    cell(sheetWatch1, 1, 0),
  w1_45:      cell(sheetWatch1, 2, 0),
  w1_cross:   cell(sheetWatch1, 0, 1),
  w1_chest:   cell(sheetWatch1, 1, 1),
  w1_read:    cell(sheetWatch1, 2, 1),   // watch at face — money frame
  /* watch — arm lowering (phase 2) */
  w2_hold:    cell(sheetWatch2, 0, 0),   // reading hold
  w2_lift:    cell(sheetWatch2, 1, 0),   // head lifts
  w2_lower1:  cell(sheetWatch2, 2, 0),
  w2_lower2:  cell(sheetWatch2, 0, 1),
  w2_lower3:  cell(sheetWatch2, 1, 1),
  w2_return:  cell(sheetWatch2, 2, 1),

  /* yawn */
  y_idle:     cell(sheetYawn, 0, 0),
  y_rise:     cell(sheetYawn, 1, 0),
  y_diag:     cell(sheetYawn, 2, 0),
  y_full:     cell(sheetYawn, 0, 1),     // full stretch + yawn — money frame
  y_lower:    cell(sheetYawn, 1, 1),
  y_return:   cell(sheetYawn, 2, 1),

  /* sleep — cycle 6 frames = one full breath */
  s_1:        cell(sheetSleep, 0, 0),
  s_2:        cell(sheetSleep, 1, 0),
  s_3:        cell(sheetSleep, 2, 0),    // deepest z-count
  s_4:        cell(sheetSleep, 0, 1),
  s_5:        cell(sheetSleep, 1, 1),
  s_6:        cell(sheetSleep, 2, 1),

  /* typing — cycle 6 frames = keyboard tap loop */
  t_rest:     cell(sheetType, 0, 0),
  t_leftIdx:  cell(sheetType, 1, 0),
  t_rightIdx: cell(sheetType, 2, 0),
  t_middles:  cell(sheetType, 0, 1),
  t_leftRing: cell(sheetType, 1, 1),
  t_restEnd:  cell(sheetType, 2, 1),

  /* panic */
  p_alarm:    cell(sheetPanic, 0, 0),
  p_rising:   cell(sheetPanic, 1, 0),
  p_approach: cell(sheetPanic, 2, 0),
  p_full:     cell(sheetPanic, 0, 1),
  p_shakeR:   cell(sheetPanic, 1, 1),
  p_shakeL:   cell(sheetPanic, 2, 1),

  /* dizzy */
  d_start:    cell(sheetDizzy, 0, 0),
  d_left:     cell(sheetDizzy, 1, 0),
  d_up1:      cell(sheetDizzy, 2, 0),
  d_right:    cell(sheetDizzy, 0, 1),
  d_up2:      cell(sheetDizzy, 1, 1),
  d_recover:  cell(sheetDizzy, 2, 1),

  /* pointing — same sheet handles both directions */
  pt_idle:    cell(sheetPoint, 0, 0),
  pt_rise:    cell(sheetPoint, 1, 0),
  pt_right:   cell(sheetPoint, 2, 0),    // point RIGHT — money frame
  pt_mid:     cell(sheetPoint, 0, 1),
  pt_left:    cell(sheetPoint, 1, 1),    // point LEFT — money frame
  pt_end:     cell(sheetPoint, 2, 1),

  /* thinking */
  th_idle:    cell(sheetThink, 0, 0),
  th_rise:    cell(sheetThink, 1, 0),
  th_chin:    cell(sheetThink, 2, 0),    // hand-at-chin — money frame
  th_gazeL:   cell(sheetThink, 0, 1),
  th_gazeR:   cell(sheetThink, 1, 1),
  th_aha:    cell(sheetThink, 2, 1),

  /* thumbs up */
  tu_idle:    cell(sheetThumb, 0, 0),
  tu_rise:    cell(sheetThumb, 1, 0),
  tu_form:    cell(sheetThumb, 2, 0),
  tu_full:    cell(sheetThumb, 0, 1),    // thumb up + big smile — money frame
  tu_tilt:    cell(sheetThumb, 1, 1),
  tu_hold:    cell(sheetThumb, 2, 1),
};

/* ── ANIMATION SEQUENCES ─────────────────────────────────────────────────
   Each sequence is [frameName, durationMs]. Money frames get long holds
   (400–700ms) so the pose registers. Motion frames are ~90ms — faster than
   most game sprite anims because our character moves smoothly (12 poses
   for arm-up-and-down is a lot of information density).

   The "ease" of the animation lives in the timing distribution, not in
   CSS transitions: a natural arc has slower entry, quick pass-through the
   middle, held apex, symmetric return.
──────────────────────────────────────────────────────────────────────── */
const SEQ = {
  /* Hello — 12 frames, ~1.4s. Arm rises quickly, waves 3 times, comes
     down more slowly (feels friendly rather than robotic). */
  helloWave: [
    ['h1_idle',   0],
    ['h1_rise1',  70],
    ['h1_rise2',  70],
    ['h1_open',   90],
    ['h1_tilt1',  110],  // wave beat 1
    ['h1_tilt2',  110],  // wave beat 2
    ['h2_tilt3',  110],  // wave beat 3
    ['h2_hold',   180],
    ['h2_desc1',  90],
    ['h2_desc2',  90],
    ['h2_desc3',  90],
    ['h2_return', 0],
  ],

  /* Watch check — 12 frames, ~1.6s. Lift is decisive, HOLD on read for
     600ms (the money frame — visitor sees it clearly), then a natural
     lower with head-lift lag. */
  watchCheck: [
    ['w1_idle',   0],
    ['w1_bend',   85],
    ['w1_45',     85],
    ['w1_cross',  90],
    ['w1_chest',  110],
    ['w1_read',   240],    // arriving at read
    ['w2_hold',   600],    // ← the money frame, held
    ['w2_lift',   130],
    ['w2_lower1', 90],
    ['w2_lower2', 90],
    ['w2_lower3', 90],
    ['w2_return', 0],
  ],

  /* Yawn — 6 frames, ~2s. Long hold on the full stretch because that IS
     the shot. Slower everything — yawns are lazy. */
  yawn: [
    ['y_idle',   0],
    ['y_rise',   180],
    ['y_diag',   180],
    ['y_full',   900],    // hold the big yawn
    ['y_lower',  200],
    ['y_return', 0],
  ],

  /* Sleep — LOOPS. Runs indefinitely until interrupted. One breath = ~2s. */
  sleepLoop: [
    ['s_1', 380], ['s_2', 380], ['s_3', 380],
    ['s_4', 380], ['s_5', 380], ['s_6', 380],
  ],

  /* Typing — LOOPS. Keyboard tap cycle, ~640ms per loop. */
  typeLoop: [
    ['t_rest',     130],
    ['t_leftIdx',  100],
    ['t_rightIdx', 100],
    ['t_middles',  110],
    ['t_leftRing', 100],
    ['t_restEnd',  100],
  ],

  /* Panic — arm rise + 3 shake frames + return. CSS adds the vibration. */
  panic: [
    ['p_alarm',    100],
    ['p_rising',   100],
    ['p_approach', 100],
    ['p_full',     200],
    ['p_shakeR',   130],
    ['p_shakeL',   130],
    ['p_shakeR',   130],
    ['p_shakeL',   130],
    ['p_full',     200],
    ['p_alarm',    0],
  ],

  /* Dizzy — head rotation + spiral eye progression. Very deliberate
     timing so the swirl reads as spinning. */
  dizzy: [
    ['d_start',   150],
    ['d_left',    200],
    ['d_up1',     150],
    ['d_right',   200],
    ['d_up2',     150],
    ['d_left',    200],
    ['d_right',   200],
    ['d_recover', 300],
  ],

  /* Point right — arm rises → held → returns. Money frame held 700ms so
     it reads as "he's actively pointing", not blinking through the pose. */
  pointRight: [
    ['pt_idle',  0],
    ['pt_rise',  120],
    ['pt_right', 700],    // held
    ['pt_end',   150],
    ['pt_idle',  0],
  ],
  /* Point left — same shape, mirrored via the LEFT frame */
  pointLeft: [
    ['pt_idle',  0],
    ['pt_mid',   150],
    ['pt_left',  700],    // held
    ['pt_end',   150],
    ['pt_idle',  0],
  ],

  /* Thinking — LOOPS if requested (event-driven), otherwise plays once
     with the gaze wandering + aha at the end. */
  ponder: [
    ['th_idle',  0],
    ['th_rise',  150],
    ['th_chin',  350],
    ['th_gazeL', 500],
    ['th_gazeR', 500],
    ['th_chin',  200],
    ['th_aha',   500],
  ],
  thinkLoop: [
    ['th_chin',  600],
    ['th_gazeL', 700],
    ['th_gazeR', 700],
    ['th_chin',  400],
  ],

  /* Thumbs up — signature "you did it" reaction */
  thumbsUp: [
    ['tu_idle',  0],
    ['tu_rise',  120],
    ['tu_form',  130],
    ['tu_full',  500],    // held
    ['tu_tilt',  200],
    ['tu_hold',  400],    // second held
    ['tu_form',  120],
    ['tu_idle',  0],
  ],
};

/* ── BEHAVIOUR CONFIGURATION ─────────────────────────────────────────── */
const IDLE_ACTION_MIN_MS   = 8_000;      // random idle picks every 8–14s
const IDLE_ACTION_MAX_MS   = 14_000;
const YAWN_BEFORE_SLEEP_MS = 22_000;     // idle → yawn at 22s
const SLEEP_TRIGGER_MS     = 32_000;     // idle → sleep at 32s
const RAPID_CLICK_MS       = 900;        // clicks within this window count as rapid

/* Random idle picks — weighted so the money animations (watch/thinking)
   run more often than the smaller reactions */
const IDLE_POOL = [
  ['watchCheck', 3],
  ['ponder',     2],
  ['thumbsUp',   1],
  ['helloWave',  1],
];

function pickWeighted(pool) {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of pool) { if ((r -= w) <= 0) return k; }
  return pool[0][0];
}

/* Speech-bubble strings, keyed by animation so they read as reactions. */
const BUBBLES = {
  helloWave:  ['hi — I\u2019m Pixel Shrey.', 'oh hey!', 'welcome back.'],
  watchCheck: ['is it really that late already?', 'time\u2026', 'hmm.'],
  yawn:       ['\u2026yaaawn.', 'getting sleepy.'],
  sleep:      ['zzz\u2026', '(dreaming of AI)', 'zzz\u2026 zzz\u2026'],
  typeLoop:   ['composing\u2026', 'let me think\u2026', 'writing\u2026'],
  panic:      ['oh no. not again.', 'this is fine.'],
  dizzy:      ['@_@', 'okay, okay.', 'whoa.'],
  pointRight: ['on it \u2192', 'over there \u2192'],
  pointLeft:  ['\u2190 on it', '\u2190 that way'],
  ponder:     ['thinking\u2026', 'hmm.', 'interesting.'],
  thumbsUp:   ['nice one!', '\ud83d\udc4d', 'good pick.'],
  thinkLoop:  ['thinking\u2026', 'processing\u2026'],
};

function pickBubble(anim) {
  const arr = BUBBLES[anim];
  if (!arr) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function PixelBuddy() {
  const [frameKey,  setFrameKey]  = useState('h1_idle');
  const [facing,    setFacing]    = useState('right');
  const [bubble,    setBubble]    = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [mood,      setMood]      = useState('idle');   // 'idle' | 'sleep' | 'panic' | 'type'

  const busyRef       = useRef(false);
  const animTORef     = useRef(null);
  const nextIdleTORef = useRef(null);
  const yawnTORef     = useRef(null);
  const sleepTORef    = useRef(null);
  const lastInputRef  = useRef(Date.now());
  const clickCountRef = useRef(0);
  const clickResetRef = useRef(null);
  const rootRef       = useRef(null);
  const sleepingRef   = useRef(false);
  const forcedRef     = useRef(false);     // event-forced state (type/panic) — idle scheduler stands down

  /* ── CORE: play a named sequence, calling onDone at the end ────────── */
  const playSeq = useCallback((seqKey, opts = {}) => {
    const seq = SEQ[seqKey];
    if (!seq) return;
    if (busyRef.current && !opts.interrupt) return;

    clearTimeout(animTORef.current);
    busyRef.current = true;

    // On start: show a bubble unless silent
    if (!opts.silent) {
      const line = pickBubble(seqKey);
      if (line) sayFor(line, opts.bubbleMs ?? 2400);
    }

    let i = 0;
    const step = () => {
      if (i >= seq.length) {
        busyRef.current = false;
        if (opts.loop) { i = 0; step(); return; }        // looping sequences never "finish"
        setFrameKey('h1_idle');
        opts.onDone?.();
        return;
      }
      const [name, dur] = seq[i++];
      setFrameKey(name);
      animTORef.current = setTimeout(step, dur);
    };
    step();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Speech bubble helper ─────────────────────────────────────────── */
  const sayFor = useCallback((text, ms = 2400) => {
    const key = Date.now();
    setBubble({ text, key });
    setTimeout(() => setBubble(prev => (prev?.key === key ? null : prev)), ms);
  }, []);

  /* ── Idle-schedule chain: watch → ponder → thumbsUp → wave etc. ──── */
  const scheduleNextIdle = useCallback(() => {
    clearTimeout(nextIdleTORef.current);
    const wait = IDLE_ACTION_MIN_MS + Math.random() * (IDLE_ACTION_MAX_MS - IDLE_ACTION_MIN_MS);
    nextIdleTORef.current = setTimeout(() => {
      if (busyRef.current || sleepingRef.current || forcedRef.current) {
        scheduleNextIdle();
        return;
      }
      const pick = pickWeighted(IDLE_POOL);
      playSeq(pick, { onDone: scheduleNextIdle });
    }, wait);
  }, [playSeq]);

  /* ── Sleep pipeline: yawn at 22s, sleep at 32s, both cancelled on any
        user activity ─────────────────────────────────────────────────── */
  const armSleepPipeline = useCallback(() => {
    clearTimeout(yawnTORef.current);
    clearTimeout(sleepTORef.current);

    yawnTORef.current = setTimeout(() => {
      if (busyRef.current || sleepingRef.current || forcedRef.current) return;
      playSeq('yawn', {
        onDone: () => {
          // schedule the actual sleep
          sleepTORef.current = setTimeout(() => {
            if (forcedRef.current) return;
            sleepingRef.current = true;
            setMood('sleep');
            playSeq('sleepLoop', { loop: true, interrupt: true });
          }, SLEEP_TRIGGER_MS - YAWN_BEFORE_SLEEP_MS);
        },
      });
    }, YAWN_BEFORE_SLEEP_MS);
  }, [playSeq]);

  const resetSleepClock = useCallback(() => {
    lastInputRef.current = Date.now();
    if (sleepingRef.current) {
      sleepingRef.current = false;
      setMood('idle');
      clearTimeout(animTORef.current);
      busyRef.current = false;
      // wake with a subtle wave — friendly, not startled
      playSeq('helloWave', { interrupt: true, onDone: scheduleNextIdle });
    }
    armSleepPipeline();
  }, [armSleepPipeline, playSeq, scheduleNextIdle]);

  /* ── Cursor tracking: face the cursor, bump the sleep clock ─────── */
  useEffect(() => {
    const onMove = (e) => {
      resetSleepClock();
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centre = rect.left + rect.width / 2;
      const next = e.clientX < centre ? 'left' : 'right';
      setFacing(prev => (prev === next ? prev : next));
    };
    const onKey = () => resetSleepClock();
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', resetSleepClock, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', resetSleepClock);
    };
  }, [resetSleepClock]);

  /* ── Boot: intro wave → start idle chain + sleep pipeline ─────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      playSeq('helloWave', {
        onDone: () => {
          scheduleNextIdle();
          armSleepPipeline();
        },
      });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Integration events dispatched by other components ────────────── */
  useEffect(() => {
    const onEvt = (e) => {
      if (dismissed) return;
      const { type, x } = e.detail || {};

      resetSleepClock();
      forcedRef.current = true;
      clearTimeout(animTORef.current);
      clearTimeout(nextIdleTORef.current);
      busyRef.current = false;

      if (type === 'launch') {
        const rect = rootRef.current?.getBoundingClientRect();
        const centreX = (rect?.left || 0) + (rect?.width || 0) / 2;
        const seq = (x ?? centreX) < centreX ? 'pointLeft' : 'pointRight';
        playSeq(seq, {
          interrupt: true,
          onDone: () => {
            forcedRef.current = false;
            scheduleNextIdle();
          },
        });
      } else if (type === 'panic') {
        setMood('panic');
        playSeq('panic', {
          interrupt: true,
          onDone: () => {
            setMood('idle');
            forcedRef.current = false;
            scheduleNextIdle();
          },
        });
      } else if (type === 'type') {
        setMood('type');
        playSeq('typeLoop', { loop: true, interrupt: true });
      } else if (type === 'think') {
        playSeq('thinkLoop', { loop: true, interrupt: true });
      } else if (type === 'stop') {
        setMood('idle');
        forcedRef.current = false;
        setFrameKey('h1_idle');
        scheduleNextIdle();
      }
    };
    window.addEventListener('shreyos-buddy', onEvt);
    return () => window.removeEventListener('shreyos-buddy', onEvt);
  }, [playSeq, resetSleepClock, scheduleNextIdle, dismissed]);

  /* ── Clicks: friendly by default, 5-rapid = dizzy ─────────────────── */
  const onClick = (e) => {
    e.stopPropagation();
    resetSleepClock();

    clickCountRef.current += 1;
    clearTimeout(clickResetRef.current);
    clickResetRef.current = setTimeout(() => { clickCountRef.current = 0; }, RAPID_CLICK_MS);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      playSeq('dizzy', { interrupt: true, onDone: scheduleNextIdle });
      return;
    }

    const reactions = ['helloWave', 'thumbsUp', 'ponder', 'watchCheck'];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    playSeq(pick, { interrupt: true, onDone: scheduleNextIdle });
  };

  const onDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
  };

  /* ── Cleanup ─────────────────────────────────────────────────────── */
  useEffect(() => () => {
    clearTimeout(animTORef.current);
    clearTimeout(nextIdleTORef.current);
    clearTimeout(yawnTORef.current);
    clearTimeout(sleepTORef.current);
    clearTimeout(clickResetRef.current);
  }, []);

  if (dismissed) return null;

  const fr = F[frameKey] || F.h1_idle;
  const spriteStyle = {
    width: DW,
    height: DH,
    backgroundImage: `url(${fr.sheet})`,
    backgroundSize: `${DW * 3}px ${DH * 2}px`,
    backgroundPosition: `${fr.x}px ${fr.y}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    transform: `scaleX(${facing === 'left' ? -1 : 1})`,
    transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div
      className={`buddy-root buddy-mood-${mood}`}
      ref={rootRef}
      aria-hidden="true">
      {bubble && (
        <div className="buddy-bubble" key={bubble.key}>
          {bubble.text}
          <span className="buddy-bubble-tail" />
        </div>
      )}
      <button
        className="buddy-sprite-btn"
        onClick={onClick}
        aria-label="Pixel Shrey"
        title="Poke me">
        <div className="buddy-sprite" style={spriteStyle} />
      </button>
      <button
        className="buddy-close"
        onClick={onDismiss}
        aria-label="Dismiss Pixel Shrey"
        title="Send home">×</button>
    </div>
  );
}
