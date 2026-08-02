export const BLINK_DURATION = 0.16;
export const BLINK_MIN_INTERVAL = 2.2;
export const BLINK_MAX_INTERVAL = 5;
export const DAMAGE_DURATION = 0.45;
export const VICTORY_DURATION = 1.8;

export function randomBlinkInterval(): number {
  return BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
}

/** Hit-shake jitter as a sum of out-of-phase sines — deterministic given
 *  elapsed time, so it needs no per-frame random state. */
export function shakeOffset(elapsedSinceHit: number, magnitude: number): [number, number, number] {
  return [
    Math.sin(elapsedSinceHit * 53) * magnitude,
    Math.sin(elapsedSinceHit * 47 + 1.3) * magnitude,
    Math.sin(elapsedSinceHit * 61 + 2.7) * magnitude,
  ];
}
