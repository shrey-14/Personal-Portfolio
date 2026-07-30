/* ══════════════════════════════════════════════════════════════════════════
   useWindowDrag.js — shared titlebar drag for SHREY/OS windows
   ---------------------------------------------------------------------------
   Extracted from five byte-identical copies that had drifted into
   AboutSection / AskShreySection / JourneySection / ProjectsSection /
   SkillsSection (their comments already said "clamp math mirrors
   SkillsSection.onTitlebarDown exactly"), plus ProjectsWindow.

   Moves the window with `transform: translate()` — composited, no layout.
   NOTE: this is only safe for windows whose transform nothing else owns.
   Win95Window in HeroSection.jsx deliberately does NOT use this hook: the
   scroll choreography in applyProgress rewrites its transform every frame,
   so it drags via left/top to stay on a separate channel.

   Behaviour preserved from the originals:
     · clamp keeps ≥80px of the window on screen horizontally
     · 54 = taskbar (32) + titlebar (22) — the bar can never swallow a window
     · offsets accumulate across drags (tx/ty persist between gestures)

   Added here:
     · multi-touch guard — a second finger mid-drag used to jump the window
     · pointer capture   — drag survives the pointer leaving the titlebar
     · rAF coalescing    — one transform write per frame, not per pointermove
   ══════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useRef } from 'react';

export default function useWindowDrag(winRef, { enabled = true } = {}) {
  const drag = useRef({ tx: 0, ty: 0, pointerId: null, raf: 0 });

  useEffect(() => () => {
    if (drag.current.raf) cancelAnimationFrame(drag.current.raf);
  }, []);

  return useCallback(e => {
    if (!enabled) return;
    if (e.target.closest?.('.win-btn')) return;
    const el = winRef.current; if (!el) return;
    const st = drag.current;
    // Multi-touch protection: once a pointer owns the drag, ignore later ones.
    if (st.pointerId != null) return;

    const bar  = e.currentTarget;   // captured now — currentTarget is null once async
    const rect = el.getBoundingClientRect();
    const homeLeft = rect.left - st.tx, homeTop = rect.top - st.ty, w = rect.width;
    const sx = e.clientX, sy = e.clientY, tx0 = st.tx, ty0 = st.ty;

    st.pointerId = e.pointerId;
    try { bar.setPointerCapture(e.pointerId); } catch { /* capture unsupported */ }

    const flush = () => {
      st.raf = 0;
      el.style.transform = `translate(${st.tx}px, ${st.ty}px)`;
    };
    const onMove = ev => {
      if (ev.pointerId !== st.pointerId) return;
      let dtx = tx0 + (ev.clientX - sx), dty = ty0 + (ev.clientY - sy);
      dtx = Math.max(-(w - 80) - homeLeft, Math.min((window.innerWidth - 80) - homeLeft, dtx));
      dty = Math.max(-homeTop, Math.min((window.innerHeight - 54) - homeTop, dty));
      st.tx = dtx; st.ty = dty;
      // One composited write per frame — pointermove outpaces the display on
      // 120Hz+ input, so unbatched writes are pure waste.
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
  }, [enabled, winRef]);
}
