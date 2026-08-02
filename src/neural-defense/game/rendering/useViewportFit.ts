import { type RefObject, useEffect, useRef, useState } from 'react';
import { computeViewportFit, type ViewportFit } from './resolution';

/** Tracks a container element's size and derives the letterboxed 4:3 viewport
 *  fit for it, re-measuring on resize via ResizeObserver (rAF-throttled). */
export function useViewportFit(containerRef: RefObject<HTMLElement>): ViewportFit {
  const [fit, setFit] = useState<ViewportFit>(() => computeViewportFit(0, 0));
  const frameRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setFit(computeViewportFit(el.clientWidth, el.clientHeight));
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(measure);
    });
    observer.observe(el);
    measure();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [containerRef]);

  return fit;
}
