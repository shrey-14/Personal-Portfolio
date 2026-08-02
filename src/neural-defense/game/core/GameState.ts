/** High-level application state for one Neural Defense session. Systems and UI
 *  react to this rather than each other, so new states (e.g. a briefing screen)
 *  slot in without rewiring existing consumers. */
export enum GameState {
  Boot = 'boot',
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'game_over',
}
