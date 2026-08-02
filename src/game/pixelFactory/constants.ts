import type {
  ModuleDef, ModuleId, TaskDef, WorkerTypeDef, PowerupDef, EventDef, WorkerTypeId,
} from './types';

export const GRID_W = 13;
export const GRID_H = 9;
export const CELL = 1; // world units per grid cell

export const MODULES: ModuleDef[] = [
  { id: 'floppy',       name: 'Floppy Drive',   short: 'A:\\',  tier: 0, gx: 1,  gy: 4, color: '#8f96a3', emissive: '#39ff14', isSpawn: true, unlockScore: 0 },
  { id: 'cpu',          name: 'CPU',            short: 'CPU',   tier: 0, gx: 6,  gy: 4, color: '#3a7bd5', emissive: '#7fd1ff', unlockScore: 0 },
  { id: 'ram',          name: 'RAM',            short: 'RAM',   tier: 0, gx: 6,  gy: 2, color: '#2fae66', emissive: '#8bffbf', unlockScore: 0 },
  { id: 'hdd',          name: 'Hard Drive',     short: 'C:\\',  tier: 0, gx: 4,  gy: 6, color: '#9b6b2c', emissive: '#ffce7a', unlockScore: 0 },
  { id: 'printer',      name: 'Printer',        short: 'LPT1',  tier: 1, gx: 11, gy: 2, color: '#c94f4f', emissive: '#ff9a9a', unlockScore: 120 },
  { id: 'cdrom',        name: 'CD-ROM',         short: 'D:\\',  tier: 1, gx: 11, gy: 6, color: '#b9b9c7', emissive: '#e8e8ff', unlockScore: 120 },
  { id: 'modem',        name: 'Modem',          short: 'COM1',  tier: 1, gx: 9,  gy: 1, color: '#3f9b8f', emissive: '#8bffee', unlockScore: 120 },
  { id: 'soundcard',    name: 'Sound Card',     short: 'SND',   tier: 1, gx: 3,  gy: 1, color: '#a24fc9', emissive: '#e0a6ff', unlockScore: 120 },
  { id: 'virusscanner', name: 'Virus Scanner',  short: 'VSC',   tier: 2, gx: 9,  gy: 7, color: '#c98f2f', emissive: '#ffd98b', unlockScore: 400 },
  { id: 'gpu',          name: 'Graphics Card',  short: 'GPU',   tier: 2, gx: 3,  gy: 7, color: '#d5457a', emissive: '#ff9ac2', unlockScore: 400 },
  { id: 'psu',          name: 'Power Supply',   short: 'PSU',   tier: 2, gx: 1,  gy: 1, color: '#c9c94f', emissive: '#fff98b', unlockScore: 400 },
  { id: 'recyclebin',   name: 'Recycle Bin',    short: 'BIN',   tier: 2, gx: 11, gy: 4, color: '#5f6b7a', emissive: '#c4d2e6', unlockScore: 400 },
  { id: 'backup',       name: 'Backup Drive',   short: 'E:\\',  tier: 2, gx: 6,  gy: 7, color: '#4f7ac9', emissive: '#a6c8ff', unlockScore: 400 },
];

export const MODULE_MAP: Record<ModuleId, ModuleDef> =
  Object.fromEntries(MODULES.map(m => [m.id, m])) as Record<ModuleId, ModuleDef>;

export const WORKER_TYPES: WorkerTypeDef[] = [
  { id: 'disk',     name: 'Disk Worker',     color: '#7fa8e8', trim: '#eef3ff' },
  { id: 'network',  name: 'Network Worker',  color: '#4fd58b', trim: '#eafff2' },
  { id: 'audio',    name: 'Audio Worker',    color: '#c98bf0', trim: '#f8ecff' },
  { id: 'video',    name: 'Video Worker',    color: '#f0a24f', trim: '#fff3e6' },
  { id: 'memory',   name: 'Memory Worker',   color: '#4fd0d0', trim: '#e6ffff' },
  { id: 'repair',   name: 'Repair Worker',   color: '#f0625f', trim: '#ffecec' },
  { id: 'delivery', name: 'Delivery Worker', color: '#e8d24f', trim: '#fffce6' },
];

export const WORKER_TYPE_MAP: Record<WorkerTypeId, WorkerTypeDef> =
  Object.fromEntries(WORKER_TYPES.map(w => [w.id, w])) as Record<WorkerTypeId, WorkerTypeDef>;

export const TASKS: TaskDef[] = [
  { id: 'save_file',        label: 'Save File',         target: 'hdd',          worker: 'disk',     tier: 0 },
  { id: 'format_disk',      label: 'Format Disk',       target: 'hdd',          worker: 'disk',     tier: 0 },
  { id: 'open_folder',      label: 'Open Folder',       target: 'hdd',          worker: 'disk',     tier: 0 },
  { id: 'load_game',        label: 'Load Game',         target: 'ram',          worker: 'memory',   tier: 0 },
  { id: 'compress_data',    label: 'Compress Data',     target: 'ram',          worker: 'memory',   tier: 0 },
  { id: 'launch_program',   label: 'Launch Program',    target: 'cpu',          worker: 'memory',   tier: 0 },
  { id: 'copy_disk',        label: 'Copy Disk',         target: 'floppy',       worker: 'disk',     tier: 0 },
  { id: 'print_document',   label: 'Print Document',    target: 'printer',      worker: 'delivery', tier: 1 },
  { id: 'install_driver',   label: 'Install Driver',    target: 'cdrom',        worker: 'delivery', tier: 1 },
  { id: 'read_cd',          label: 'Read CD',           target: 'cdrom',        worker: 'delivery', tier: 1 },
  { id: 'connect_internet', label: 'Connect Internet',  target: 'modem',        worker: 'network',  tier: 1 },
  { id: 'play_audio',       label: 'Play Audio',        target: 'soundcard',    worker: 'audio',    tier: 1 },
  { id: 'play_music',       label: 'Play Music',        target: 'soundcard',    worker: 'audio',    tier: 1 },
  { id: 'delete_virus',     label: 'Delete Virus',      target: 'virusscanner', worker: 'repair',   tier: 2 },
  { id: 'open_paint',       label: 'Open Paint',        target: 'gpu',          worker: 'video',    tier: 2 },
  { id: 'decode_image',     label: 'Decode Image',      target: 'gpu',          worker: 'video',    tier: 2 },
  { id: 'restore_power',    label: 'Restore Power',     target: 'psu',          worker: 'repair',   tier: 2 },
  { id: 'empty_recycle',    label: 'Empty Trash',       target: 'recyclebin',   worker: 'delivery', tier: 2 },
  { id: 'backup_data',      label: 'Backup Data',       target: 'backup',       worker: 'disk',     tier: 2 },
];

export const TASK_MAP = Object.fromEntries(TASKS.map(t => [t.id, t]));

export const POWERUPS: PowerupDef[] = [
  { id: 'turbo_cpu',         name: 'Turbo CPU',          short: 'TURBO',  duration: 10, color: '#7fd1ff' },
  { id: 'double_speed',      name: 'Double Conveyor',    short: '2X BELT', duration: 10, color: '#8bffbf' },
  { id: 'instant_repair',    name: 'Instant Repair',     short: 'REPAIR', duration: 0,  color: '#ffce7a' },
  { id: 'freeze_time',       name: 'Freeze Time',        short: 'FREEZE', duration: 6,  color: '#a6c8ff' },
  { id: 'disk_cleanup',      name: 'Disk Cleanup',       short: 'CLEANUP', duration: 0, color: '#ffd98b' },
  { id: 'auto_sort',         name: 'Auto Sort',          short: 'AUTOSORT', duration: 8, color: '#e0a6ff' },
  { id: 'virus_shield',      name: 'Virus Shield',       short: 'SHIELD', duration: 15, color: '#8bffee' },
  { id: 'combo_multiplier',  name: 'Combo x2',           short: 'COMBOx2', duration: 12, color: '#fff98b' },
];

export const POWERUP_MAP = Object.fromEntries(POWERUPS.map(p => [p.id, p]));

export const EVENTS: EventDef[] = [
  { id: 'virus_infection',     name: 'Virus Infection',    desc: 'Infected workers are loose — route them to the Virus Scanner fast!', duration: 20 },
  { id: 'power_surge',         name: 'Power Surge',        desc: 'Everything is running hot and fast.', duration: 12 },
  { id: 'disk_full',           name: 'Disk Full',          desc: 'Hard Drive is refusing new writes.', duration: 15, targetModule: 'hdd' },
  { id: 'memory_leak',         name: 'Memory Leak',        desc: 'RAM is leaking — overload is climbing.', duration: 18, targetModule: 'ram' },
  { id: 'printer_jam',         name: 'Printer Jam',        desc: 'The Printer has jammed.', duration: 15, targetModule: 'printer' },
  { id: 'broken_floppy',       name: 'Broken Floppy',      desc: 'Drive A: is sputtering — arrivals have slowed.', duration: 12, targetModule: 'floppy' },
  { id: 'cd_read_error',       name: 'CD Read Error',      desc: 'The CD-ROM cannot read the disc.', duration: 15, targetModule: 'cdrom' },
  { id: 'internet_disconnect', name: 'Internet Disconnect', desc: 'The Modem lost carrier.', duration: 15, targetModule: 'modem' },
  { id: 'registry_corruption', name: 'Registry Corruption', desc: 'Task icons are scrambled!', duration: 10 },
];

export const EVENT_MAP = Object.fromEntries(EVENTS.map(e => [e.id, e]));

/* ── Difficulty & pacing ─────────────────────────────────────────────────── */
export const TUNING = {
  spawnIntervalStart: 3.2,
  spawnIntervalMin: 0.85,
  spawnRampPerSec: 0.012,
  workerSpeedStart: 1.6,
  workerSpeedMax: 3.4,
  overloadDecayPerSec: 1.1,
  overloadOnWrong: 9,
  overloadOnMissed: 15,
  overloadOnWaitTick: 4, // per second waiting with no route, once past grace period
  waitGraceSeconds: 5,
  waitHardTimeout: 13,
  scorePerCorrect: 10,
  comboStep: 0.12,
  comboMax: 3,
  eventMinGap: 22,
  eventMaxGap: 42,
  powerupMinGap: 14,
  powerupMaxGap: 26,
  multiSpawnScore: 260,   // score at which a 2nd worker can spawn same tick
};

/* Score thresholds at which each tier's modules power on. */
export const TIER_UNLOCK_SCORE: Record<number, number> = { 0: 0, 1: 120, 2: 400 };

/* Mastery milestones — first N correct deliveries to a module opens a real
   portfolio section, so "unlocking a module" is felt as expanding the OS. */
export const PORTFOLIO_MILESTONES: {
  module: ModuleId; count: number; section: 'projects' | 'skills' | 'contact' | 'resume';
}[] = [
  { module: 'cpu',    count: 5, section: 'skills' },
  { module: 'gpu',    count: 5, section: 'projects' },
  { module: 'modem',  count: 5, section: 'contact' },
  { module: 'printer', count: 5, section: 'resume' },
];

export const HIGH_SCORE_KEY = 'pixelFactory95_highScore';
export const SETTINGS_KEY = 'pixelFactory95_settings';
