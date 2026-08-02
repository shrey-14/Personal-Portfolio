import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from '../data/constants';

export interface ViewportFit {
  /** CSS pixels — the largest 4:3 box that fits inside the container. */
  width: number;
  height: number;
  /** Passed as R3F's `dpr` to force the WebGL drawing buffer down to the fixed
   *  virtual resolution regardless of the CSS box's on-screen size. */
  dpr: number;
}

const VIRTUAL_ASPECT = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;

/** Computes the largest 4:3 rect that fits a container of arbitrary aspect
 *  ratio (letterbox/pillarbox math), plus the devicePixelRatio override that
 *  keeps the actual rendered resolution pinned at VIRTUAL_WIDTH x VIRTUAL_HEIGHT
 *  no matter how large or small that rect ends up on screen. That combination
 *  is what gives the fixed retro resolution + responsive scaling + chunky
 *  pixelation, together, without a manual render-target blit pass. */
export function computeViewportFit(containerWidth: number, containerHeight: number): ViewportFit {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT, dpr: 1 };
  }

  const containerAspect = containerWidth / containerHeight;
  const width = containerAspect > VIRTUAL_ASPECT ? containerHeight * VIRTUAL_ASPECT : containerWidth;
  const height = containerAspect > VIRTUAL_ASPECT ? containerHeight : containerWidth / VIRTUAL_ASPECT;

  return { width, height, dpr: VIRTUAL_WIDTH / width };
}
