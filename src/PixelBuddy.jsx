import { useEffect, useRef, useState, useCallback } from 'react';
import buddySrc from './assets/pixel_buddy.png';

/* ═══════════════════════════════════════════════════════════════════════════
   PIXEL BUDDY — the tiny inhabitant of SHREY/OS
   ───────────────────────────────────────────────────────────────────────────
   A sprite-driven interactive character (pixel-art Shrey) who lives on the
   taskbar. Deliberately built as a TRANSFORM/STATE engine, not video: every
   reaction is instant, weightless (~one PNG), composited on the GPU, and works
   identically on a phone — the way a '95-era desktop pet actually worked.

   BEHAVIOURS
   · Idle life: bobs gently; every 7–14s randomly looks toward your cursor,
     stretches, checks his watch, or mutters something in a Win95 tooltip.
   · Sleep: ~35s with no input → dozes ("z z z…"); any activity wakes him.
   · Launch escort: opening Contact/About makes him dash toward the window
     ("on it…") before the UI responds (~0.7s), then dash back.
   · Typing: while the Mail window is open he types along ("⌨ composing…").
   · Panic: the BSOD easter egg makes him shake ("oh no. not again.").
   · Poke reactions: click him for a rotating set of replies; FIVE rapid
     clicks → dizzy spin ("@_@"). Curiosity is rewarded.
   · Cursor awareness: he faces whichever side your cursor is on.

   INTEGRATION EVENTS (dispatched by HeroSection):
     window.dispatchEvent(new CustomEvent('shreyos-buddy',
       { detail: { type: 'launch'|'contact-open'|'contact-close'|'bsod', x? } }))

   isBuddyActive() lets HeroSection decide whether to give launch actions the
   small pre-animation delay (never on touch / reduced-motion).
═══════════════════════════════════════════════════════════════════════════ */

let _active = false;
export function isBuddyActive() { return _active; }

const POKES  = ['hey!', '*wave*', 'sup?', 'still compiling…', 'nice cursor.'];
const IDLES  = ['☕ brb', '*stretch*', 'shipping soon…', '01:32 already?', '👀'];

export default function PixelBuddy({ mobile = false }) {
  const wrapRef   = useRef(null);
  const [state, setState]   = useState('idle');   // idle|walk|sleep|typing|dizzy|panic|wave
  const [bubble, setBubble] = useState(null);     // string | null
  const [flip, setFlip]     = useState(false);    // face left?
  const posR      = useRef(mobile ? 0.76 : 0.18); // x as fraction of viewport width
  const homeR     = useRef(mobile ? 0.76 : 0.18);
  const stateR    = useRef('idle');
  const lastActR  = useRef(Date.now());
  const pokesR    = useRef({ n: 0, t: 0, i: 0 });
  const timersR   = useRef([]);
  const reduced   = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setS = useCallback((s) => { stateR.current = s; setState(s); }, []);
  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersR.current.push(id);
    return id;
  }, []);
  const say = useCallback((text, ms = 2200) => {
    setBubble(text);
    later(() => setBubble(b => (b === text ? null : b)), ms);
  }, [later]);

  const applyX = useCallback(() => {
    const el = wrapRef.current;
    if (el) el.style.transform = `translateX(${(posR.current * window.innerWidth).toFixed(1)}px)`;
  }, []);

  /* Walk to a viewport-x fraction, then run cb. Duration scales with distance. */
  const walkTo = useCallback((xFrac, cb) => {
    if (reduced) { cb?.(); return; }
    const el = wrapRef.current;
    if (!el) { cb?.(); return; }
    const from = posR.current;
    const to = Math.min(0.9, Math.max(0.04, xFrac));
    setFlip(to < from);
    setS('walk');
    const dur = Math.min(900, Math.max(420, Math.abs(to - from) * 1600));
    el.style.transition = `transform ${dur}ms linear`;
    posR.current = to;
    applyX();
    later(() => {
      el.style.transition = '';
      if (stateR.current === 'walk') setS('idle');
      cb?.();
    }, dur + 30);
  }, [reduced, setS, applyX, later]);

  /* ── Mount: mark active, place at home, wire events ── */
  useEffect(() => {
    _active = !mobile && !reduced;
    applyX();
    const el = wrapRef.current;
    if (el) requestAnimationFrame(() => el.classList.add('buddy-in'));

    /* External events from the OS */
    const onOs = (e) => {
      const { type, x } = e.detail || {};
      if (type === 'launch') {
        lastActR.current = Date.now();
        say('on it…', 900);
        walkTo(typeof x === 'number' ? x : 0.5, () => {
          later(() => walkTo(homeR.current), 900);
        });
      } else if (type === 'contact-open') {
        setS('typing'); say('⌨ composing…', 2600);
      } else if (type === 'contact-close') {
        if (stateR.current === 'typing') { setS('idle'); say('sent? 📨', 1600); }
      } else if (type === 'bsod') {
        setS('panic'); say('oh no. not again.', 2600);
        later(() => { if (stateR.current === 'panic') setS('idle'); }, 2800);
      }
    };
    window.addEventListener('shreyos-buddy', onOs);

    /* Cursor awareness + wake-from-sleep */
    const onMove = (e) => {
      lastActR.current = Date.now();
      if (stateR.current === 'sleep') { setS('idle'); say('!', 700); }
      if (stateR.current === 'idle' && !mobile) {
        const bx = posR.current * window.innerWidth;
        setFlip(e.clientX < bx);
      }
    };
    const onAny = () => {
      lastActR.current = Date.now();
      if (stateR.current === 'sleep') { setS('idle'); say('!', 700); }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onAny, { passive: true });
    window.addEventListener('keydown', onAny);
    window.addEventListener('resize', applyX);

    /* Idle life scheduler */
    const tick = setInterval(() => {
      const idleFor = Date.now() - lastActR.current;
      if (stateR.current !== 'idle') return;
      if (idleFor > 35000 && !reduced) { setS('sleep'); say('z z z…', 3400); return; }
      if (Math.random() < 0.5) return;                 // ~every other beat
      const act = Math.random();
      if (act < 0.35)      say(IDLES[Math.floor(Math.random() * IDLES.length)], 1900);
      else if (act < 0.6)  { setS('stretch'); later(() => stateR.current === 'stretch' && setS('idle'), 1100); }
      else if (act < 0.8)  { setS('watch');   say('⌚', 1400); later(() => stateR.current === 'watch' && setS('idle'), 1500); }
      else                 { setFlip(f => !f); }       // glance around
    }, 8000 + Math.random() * 5000);

    /* Sleep bubble refresh */
    const zTick = setInterval(() => {
      if (stateR.current === 'sleep') say('z z z…', 3400);
    }, 4200);

    const timers = timersR.current;
    return () => {
      _active = false;
      window.removeEventListener('shreyos-buddy', onOs);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onAny);
      window.removeEventListener('keydown', onAny);
      window.removeEventListener('resize', applyX);
      clearInterval(tick); clearInterval(zTick);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Poke: click reactions + dizzy easter egg ── */
  const onPoke = useCallback(() => {
    lastActR.current = Date.now();
    const now = Date.now();
    const p = pokesR.current;
    p.n = (now - p.t < 2500) ? p.n + 1 : 1;
    p.t = now;
    if (stateR.current === 'sleep') { setS('idle'); say('…I was resting.', 1800); return; }
    if (p.n >= 5) {
      p.n = 0;
      setS('dizzy'); say('@_@', 2200);
      later(() => stateR.current === 'dizzy' && setS('idle'), 2300);
      return;
    }
    setS('wave');
    say(POKES[p.i++ % POKES.length], 1700);
    later(() => stateR.current === 'wave' && setS('idle'), 900);
  }, [setS, say, later]);

  return (
    <div
      ref={wrapRef}
      className={`pixel-buddy pixel-buddy-${state}${mobile ? ' pixel-buddy-mobile' : ''}`}
      aria-hidden="true"
    >
      {bubble && (
        <div className="buddy-bubble" key={bubble}>
          {bubble}
          <span className="buddy-bubble-tail" />
        </div>
      )}
      <button
        className="buddy-hit"
        aria-label="Pixel Shrey"
        tabIndex={-1}
        onClick={onPoke}
      >
        <img
          src={buddySrc}
          alt=""
          draggable={false}
          className={`buddy-img${flip ? ' buddy-flip' : ''}`}
        />
      </button>
      <div className="buddy-shadow" />
    </div>
  );
}