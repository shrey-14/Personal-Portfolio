/** Shared magic numbers for the Neural Defense game module. */

export const FIXED_TIMESTEP_HZ = 60;

/** Virtual render resolution — locked 4:3, matching the late-90s PC games this
 *  is styled after. GameCanvas letterboxes to this ratio and forces the WebGL
 *  drawing buffer down to it regardless of on-screen CSS size. */
export const VIRTUAL_WIDTH = 320;
export const VIRTUAL_HEIGHT = 240;
export const VIRTUAL_ASPECT = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;

export const SAVE_KEY_PREFIX = 'neural-defense:';
export const SAVE_VERSION = 1;
