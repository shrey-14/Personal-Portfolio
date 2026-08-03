/* ══════════════════════════════════════════════════════════════════════════
   Pixel Factory 95 — shared type definitions.
   ═════════════════════════════════════════════════════════════════════════ */

export type ModuleId =
  | 'floppy' | 'cpu' | 'ram' | 'hdd'
  | 'printer' | 'cdrom' | 'modem' | 'soundcard'
  | 'virusscanner' | 'gpu' | 'psu' | 'recyclebin' | 'backup';

export type ModuleState = 'idle' | 'working' | 'overloaded' | 'offline' | 'locked';

export interface ModuleDef {
  id: ModuleId;
  name: string;
  short: string;
  tier: 0 | 1 | 2;
  /** grid cell the module sits on (isometric factory floor) */
  gx: number;
  gy: number;
  color: string;
  emissive: string;
  isSpawn?: boolean;
  unlockScore: number;
}

export type TaskId =
  | 'save_file' | 'format_disk' | 'open_folder'
  | 'print_document'
  | 'install_driver' | 'read_cd'
  | 'play_audio' | 'play_music'
  | 'load_game' | 'compress_data'
  | 'connect_internet'
  | 'launch_program'
  | 'open_paint' | 'decode_image'
  | 'delete_virus'
  | 'backup_data'
  | 'copy_disk'
  | 'empty_recycle'
  | 'restore_power';

export type WorkerTypeId = 'disk' | 'network' | 'audio' | 'video' | 'memory' | 'repair' | 'delivery';

export interface TaskDef {
  id: TaskId;
  label: string;
  target: ModuleId;
  worker: WorkerTypeId;
  tier: 0 | 1 | 2;
}

export interface WorkerTypeDef {
  id: WorkerTypeId;
  name: string;
  color: string;
  trim: string;
}

export type PowerupId =
  | 'turbo_cpu' | 'double_speed' | 'instant_repair' | 'freeze_time'
  | 'disk_cleanup' | 'auto_sort' | 'virus_shield' | 'combo_multiplier';

export interface PowerupDef {
  id: PowerupId;
  name: string;
  short: string;
  duration: number; // seconds, 0 = instant
  color: string;
}

export type EventId =
  | 'virus_infection' | 'power_surge' | 'disk_full' | 'memory_leak'
  | 'printer_jam' | 'broken_floppy' | 'cd_read_error'
  | 'internet_disconnect' | 'registry_corruption';

export interface EventDef {
  id: EventId;
  name: string;
  desc: string;
  duration: number;
  /** module this event knocks offline, if any */
  targetModule?: ModuleId;
}

export type WorkerAnim = 'walk' | 'blink' | 'happy' | 'confused' | 'panic' | 'wait';

export interface WorkerState {
  id: number;
  typeId: WorkerTypeId;
  taskId: TaskId;
  target: ModuleId;
  infected?: boolean;
  /** path of grid points the worker walks along, world space */
  path: [number, number][];
  pathIdx: number;
  x: number;
  y: number;
  spawnedAt: number;
  anim: WorkerAnim;
  animT: number;
  waitT: number;
  resolvedModule: ModuleId | null;
  outcome: 'pending' | 'correct' | 'wrong' | 'missed';
}

export interface BeltEdge {
  id: string;
  from: ModuleId;
  to: ModuleId;
  cells: [number, number][];
}

export interface FloatingPowerup {
  id: number;
  powerupId: PowerupId;
  gx: number;
  gy: number;
  spawnedAt: number;
}

export interface ActiveEvent {
  id: number;
  defId: EventId;
  startedAt: number;
  until: number;
}

export interface ActivePowerup {
  id: number;
  defId: PowerupId;
  startedAt: number;
  until: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

export interface UnlockToastState {
  id: number;
  section: 'projects' | 'skills' | 'contact' | 'resume';
  moduleName: string;
}

export interface GameStats {
  score: number;
  combo: number;
  bestCombo: number;
  overload: number;
  correct: number;
  wrong: number;
  missed: number;
  elapsed: number;
  wave: number;
}
