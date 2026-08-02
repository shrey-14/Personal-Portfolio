/** Energy segments regenerate at 1 per FIRE_COOLDOWN_SECONDS — that rate
 *  doubles as the fire cooldown (can't sustain faster than this once the
 *  bank is empty) and as what the segmented meter visualizes filling. */
export const FIRE_COOLDOWN_SECONDS = 0.6;
export const MAX_ENERGY = 5;

export const PROJECTILE_DAMAGE = 10;
export const PROJECTILE_FLIGHT_SECONDS = 0.42;

/** Max NDC distance (roughly a fraction of the screen) a pointer can be from
 *  an enemy's projected position and still count as hovering/locking it. */
export const HOVER_NDC_RADIUS = 0.16;
