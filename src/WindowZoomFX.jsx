/* ══════════════════════════════════════════════════════════════════════════
   WindowZoomFX.jsx — the Windows 95 minimise/restore wireframe zoom
   ---------------------------------------------------------------------------
   Windows 95 did not slide or fade windows. Minimising drew a hollow rectangle
   that flew between the window's bounds and its taskbar button, in a couple of
   frames, and that single animation is what tied the taskbar to the desktop:
   without it a window just vanishes and a button appears, with no sense that
   they are the same object.

   Driven by `os.zoomFx`, which OSContext sets inside wAction. Payload:
     { key, id, dir: 'out' | 'in', btn: rect, win: rect | null }
   `win` is null on restore, because a minimised window is display:none and has
   no rect until React reveals it — so we measure it on the next frame.

   Only `transform` and `opacity` are animated, via WAAPI: one composited layer,
   no layout, and the rect-to-rect morph is exact because the element is sized
   to the SOURCE rect and scaled by the ratio to the target.
   ══════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from 'react';
import { useOS } from './OSContext';

/* Win95 was near-instant. Long enough to read as a connection, short enough
   that it never sits between the click and the result. */
const DURATION = 180;
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

export default function WindowZoomFX() {
  const os = useOS();
  const fx = os.zoomFx;
  const ref = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!fx || !ref.current) return;
    const el = ref.current;

    let cancelled = false;
    let rafId = 0;

    const run = winRect => {
      if (cancelled || !winRect || !winRect.w || !winRect.h) return;
      const from = fx.dir === 'out' ? winRect : fx.btn;
      const to   = fx.dir === 'out' ? fx.btn  : winRect;
      if (!from.w || !from.h || !to.w || !to.h) return;

      // Size the wireframe to the SOURCE rect, then scale to the target.
      el.style.left   = `${from.x}px`;
      el.style.top    = `${from.y}px`;
      el.style.width  = `${from.w}px`;
      el.style.height = `${from.h}px`;
      el.style.display = 'block';

      // Interrupt any in-flight zoom rather than letting two overlap.
      animRef.current?.cancel();
      animRef.current = el.animate(
        [
          { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 0.9 },
          {
            transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) ` +
                       `scale(${to.w / from.w}, ${to.h / from.h})`,
            opacity: 0.25,
          },
        ],
        { duration: DURATION, easing: EASING, fill: 'forwards' }
      );
      animRef.current.onfinish = () => { el.style.display = 'none'; };
    };

    if (fx.win) {
      run(fx.win);
    } else {
      /* Restore: wait a frame for React to un-hide the window, then measure. */
      rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        // :not(.tb-task) — the taskbar button shares this id (see OSContext).
        const winEl = document.querySelector(`[data-win-id="${fx.id}"]:not(.tb-task)`);
        if (!winEl) return;
        const r = winEl.getBoundingClientRect();
        run({ x: r.left, y: r.top, w: r.width, h: r.height });
      });
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [fx]);

  return <div ref={ref} className="win-zoom-ghost" aria-hidden="true" />;
}
