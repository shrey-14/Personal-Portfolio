/* ══════════════════════════════════════════════════════════════════════════
   Pixel Factory 95 — core simulation. Framework-agnostic: a plain class that
   ticks forward in time, owns every worker/belt/module/event/powerup, and is
   read by React only through getSnapshot(). Kept outside React so the 60fps
   movement loop never fights the reconciler.
   ═════════════════════════════════════════════════════════════════════════ */
import {
  MODULES, MODULE_MAP, TASKS, TUNING, EVENTS, EVENT_MAP, POWERUPS,
  PORTFOLIO_MILESTONES, GRID_W, GRID_H,
} from './constants';
import { portOf, findCellPath, type Cell } from './grid';
import type {
  ModuleId, ModuleState, TaskDef, WorkerState, BeltEdge, FloatingPowerup,
  ActiveEvent, ActivePowerup, FloatingText, EventId, PowerupId, GameStats,
  UnlockToastState,
} from './types';

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p: number) { return Math.random() < p; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export interface EngineCallbacks {
  onSound: (name:
    'workerComplete' | 'workerWrong' | 'workerMissed' | 'diskAccess' | 'printer' |
    'notification' | 'errorBeep' | 'combo' | 'overloadAlarm' | 'moduleStartup' | 'powerup') => void;
  onToast: (toast: UnlockToastState) => void;
  onModuleUnlock: (moduleId: ModuleId) => void;
  onEventStart: (id: EventId) => void;
  onGameOver: (stats: GameStats) => void;
}

export interface EngineSnapshot {
  workers: WorkerState[];
  belts: BeltEdge[];
  moduleStates: Record<ModuleId, ModuleState>;
  moduleWorkFlash: Record<ModuleId, number>;
  floatingPowerups: FloatingPowerup[];
  floatingTexts: FloatingText[];
  activeEvents: ActiveEvent[];
  activePowerups: ActivePowerup[];
  stats: GameStats;
  iconsScrambled: boolean;
  spawnFlash: number;
}

export class GameEngine {
  private cb: EngineCallbacks;
  private t = 0;
  private idCounter = 1;
  private spawnTimer = TUNING.spawnIntervalStart;
  private eventTimer = TUNING.eventMinGap;
  private powerupTimer = TUNING.powerupMinGap;
  private ended = false;

  workers: WorkerState[] = [];
  belts: BeltEdge[] = [];
  moduleStates: Record<ModuleId, ModuleState> = {} as any;
  moduleWorkFlash: Record<ModuleId, number> = {} as any;
  perModuleCorrect: Partial<Record<ModuleId, number>> = {};
  floatingPowerups: FloatingPowerup[] = [];
  floatingTexts: FloatingText[] = [];
  activeEvents: ActiveEvent[] = [];
  activePowerups: ActivePowerup[] = [];
  iconsScrambled = false;
  spawnFlash = 0;

  score = 0;
  combo = 0;
  bestCombo = 0;
  overload = 0;
  correct = 0;
  wrong = 0;
  missed = 0;

  constructor(cb: EngineCallbacks) {
    this.cb = cb;
    for (const m of MODULES) {
      this.moduleStates[m.id] = m.tier === 0 ? 'idle' : 'locked';
      this.moduleWorkFlash[m.id] = 0;
    }
  }

  /* ── belts ────────────────────────────────────────────────────────────── */
  addBelt(from: ModuleId, to: ModuleId): boolean {
    if (from === to) return false;
    if (this.moduleStates[to] === 'locked' || this.moduleStates[from] === 'locked') return false;
    if (this.belts.some(b => b.from === from && b.to === to)) return false;
    const path = findCellPath(portOf(from), portOf(to));
    if (!path) return false;
    this.belts.push({ id: `${from}->${to}#${this.idCounter++}`, from, to, cells: path });
    this.cb.onSound('diskAccess');
    return true;
  }

  removeBelt(id: string) {
    this.belts = this.belts.filter(b => b.id !== id);
  }

  /* ── routing: shortest chain of belts from the spawn to a target ────────── */
  private routeTo(target: ModuleId): ModuleId[] | null {
    const adj = new Map<ModuleId, ModuleId[]>();
    for (const b of this.belts) {
      if (this.moduleStates[b.to] === 'offline') continue;
      if (!adj.has(b.from)) adj.set(b.from, []);
      adj.get(b.from)!.push(b.to);
    }
    const start: ModuleId = 'floppy';
    const visited = new Set<ModuleId>([start]);
    const prev = new Map<ModuleId, ModuleId>();
    const queue: ModuleId[] = [start];
    let qi = 0;
    let fallback: ModuleId | null = null;
    while (qi < queue.length) {
      const cur = queue[qi++];
      if (cur === target) {
        const path: ModuleId[] = [cur];
        let c = cur;
        while (c !== start) { c = prev.get(c)!; path.push(c); }
        return path.reverse();
      }
      if (cur !== start && !fallback) fallback = cur;
      for (const next of adj.get(cur) || []) {
        if (visited.has(next)) continue;
        visited.add(next); prev.set(next, cur); queue.push(next);
      }
    }
    if (fallback) {
      const path: ModuleId[] = [fallback];
      let c = fallback;
      while (c !== start) { c = prev.get(c)!; path.push(c); }
      return path.reverse();
    }
    return null;
  }

  private waypointsFor(route: ModuleId[]): Cell[] {
    const pts: Cell[] = [portOf(route[0])];
    for (let i = 0; i < route.length - 1; i++) {
      const belt = this.belts.find(b => b.from === route[i] && b.to === route[i + 1]);
      if (!belt) continue;
      for (const c of belt.cells) pts.push(c);
    }
    return pts;
  }

  /* ── spawning ─────────────────────────────────────────────────────────── */
  private availableTasks(): TaskDef[] {
    return TASKS.filter(t => this.moduleStates[t.target] !== 'locked');
  }

  private spawnWorker() {
    const tasks = this.availableTasks();
    if (!tasks.length) return;
    const task = pick(tasks);
    const infected = this.hasEvent('virus_infection') && chance(0.35);
    const [sx, sy] = portOf('floppy');
    const w: WorkerState = {
      id: this.idCounter++,
      typeId: task.worker,
      taskId: task.id,
      target: infected ? 'virusscanner' : task.target,
      infected,
      path: [[sx, sy]],
      pathIdx: 0,
      x: sx, y: sy,
      spawnedAt: this.t,
      anim: 'walk',
      animT: 0,
      waitT: 0,
      resolvedModule: null,
      outcome: 'pending',
    };
    if (w.target === 'floppy') {
      // Tasks the floppy drive itself handles (Copy Disk) are done the instant
      // they arrive — there is nowhere to route them, so resolve on the spot
      // instead of leaving them stuck waiting for an unbuildable self-belt.
      w.outcome = this.resolveArrival(w, 'floppy');
      w.anim = w.outcome === 'correct' ? 'happy' : 'confused';
    } else {
      this.assignRoute(w);
    }
    this.workers.push(w);
    this.spawnFlash = 0.35;
  }

  private assignRoute(w: WorkerState) {
    const autoSort = this.hasPowerup('auto_sort');
    let route = this.routeTo(w.target);
    if (autoSort && (!route || route[route.length - 1] !== w.target) && this.moduleStates[w.target] !== 'offline' && this.moduleStates[w.target] !== 'locked') {
      route = ['floppy', w.target];
      w.path = [portOf('floppy'), portOf(w.target)];
      w.pathIdx = 0;
      w.anim = 'walk';
      return;
    }
    if (route && route.length > 1) {
      w.path = this.waypointsFor(route);
      w.pathIdx = 0;
      w.anim = 'walk';
    } else {
      w.path = [[w.x, w.y]];
      w.pathIdx = 0;
      w.anim = 'wait';
    }
  }

  /* ── events & powerups ────────────────────────────────────────────────── */
  hasEvent(id: EventId) { return this.activeEvents.some(e => e.defId === id); }
  hasPowerup(id: PowerupId) { return this.activePowerups.some(p => p.defId === id); }

  private speedMultiplier() {
    let m = 1;
    if (this.hasEvent('power_surge')) m *= 1.55;
    if (this.hasPowerup('double_speed')) m *= 2;
    if (this.hasPowerup('turbo_cpu')) m *= 1.4;
    if (this.hasPowerup('freeze_time')) m *= 0.001;
    return m;
  }

  private triggerEvent() {
    const candidates = EVENTS.filter(e => !this.hasEvent(e.id));
    if (!candidates.length) return;
    const def = pick(candidates);
    if (def.id === 'virus_infection' && this.hasPowerup('virus_shield')) return;
    if (def.targetModule && (this.moduleStates[def.targetModule] === 'locked')) return;
    this.activeEvents.push({ id: this.idCounter++, defId: def.id, startedAt: this.t, until: this.t + def.duration });
    if (def.targetModule && def.id !== 'broken_floppy') this.moduleStates[def.targetModule] = 'offline';
    if (def.id === 'registry_corruption') this.iconsScrambled = true;
    this.cb.onEventStart(def.id);
  }

  private endEvent(ev: ActiveEvent) {
    const def = EVENT_MAP[ev.defId];
    if (def.targetModule && def.id !== 'broken_floppy' && this.moduleStates[def.targetModule] === 'offline') {
      this.moduleStates[def.targetModule] = 'idle';
    }
    if (def.id === 'registry_corruption') this.iconsScrambled = false;
  }

  collectPowerup(id: number) {
    const fp = this.floatingPowerups.find(f => f.id === id);
    if (!fp) return;
    this.floatingPowerups = this.floatingPowerups.filter(f => f.id !== id);
    this.applyPowerup(fp.powerupId);
    this.cb.onSound('powerup');
  }

  private applyPowerup(id: PowerupId) {
    const def = POWERUPS.find(p => p.id === id)!;
    if (id === 'instant_repair') {
      for (const ev of this.activeEvents) this.endEvent(ev);
      this.activeEvents = [];
      return;
    }
    if (id === 'disk_cleanup') {
      this.overload = clamp(this.overload - 25, 0, 100);
      return;
    }
    this.activePowerups = this.activePowerups.filter(p => p.defId !== id);
    this.activePowerups.push({ id: this.idCounter++, defId: id, startedAt: this.t, until: this.t + def.duration });
    if (id === 'auto_sort') {
      for (const w of this.workers) if (w.anim === 'wait') this.assignRoute(w);
    }
  }

  private spawnFloatingPowerup() {
    const free: [number, number][] = [];
    const occupied = new Set(MODULES.map(m => `${m.gx},${m.gy}`));
    for (let x = 1; x < GRID_W - 1; x++) {
      for (let y = 1; y < GRID_H - 1; y++) {
        if (!occupied.has(`${x},${y}`)) free.push([x, y]);
      }
    }
    if (!free.length) return;
    const [gx, gy] = pick(free);
    const def = pick(POWERUPS);
    this.floatingPowerups.push({ id: this.idCounter++, powerupId: def.id, gx, gy, spawnedAt: this.t });
    if (this.floatingPowerups.length > 3) this.floatingPowerups.shift();
  }

  /* ── portfolio milestones ────────────────────────────────────────────── */
  private checkMilestones(moduleId: ModuleId) {
    const n = (this.perModuleCorrect[moduleId] = (this.perModuleCorrect[moduleId] || 0) + 1);
    const hit = PORTFOLIO_MILESTONES.find(m => m.module === moduleId && m.count === n);
    if (hit) {
      this.cb.onToast({ id: this.idCounter++, section: hit.section, moduleName: MODULE_MAP[moduleId].name });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({ id: this.idCounter++, x, y, text, color, createdAt: this.t });
    if (this.floatingTexts.length > 24) this.floatingTexts.shift();
  }

  /* ── main tick ────────────────────────────────────────────────────────── */
  tick(dt: number) {
    if (this.ended) return;
    dt = Math.min(dt, 0.1);
    this.t += dt;
    this.spawnFlash = Math.max(0, this.spawnFlash - dt);

    for (const id in this.moduleWorkFlash) {
      // @ts-expect-error string-indexed
      this.moduleWorkFlash[id] = Math.max(0, this.moduleWorkFlash[id] - dt);
    }

    // module unlocks
    for (const m of MODULES) {
      if (this.moduleStates[m.id] === 'locked' && this.score >= m.unlockScore) {
        this.moduleStates[m.id] = 'idle';
        this.cb.onSound('moduleStartup');
        this.cb.onModuleUnlock(m.id);
      }
    }

    // events lifecycle
    this.eventTimer -= dt;
    if (this.eventTimer <= 0 && this.t > 18) {
      this.triggerEvent();
      this.eventTimer = TUNING.eventMinGap + Math.random() * (TUNING.eventMaxGap - TUNING.eventMinGap);
    }
    if (this.activeEvents.length) {
      const stillActive: ActiveEvent[] = [];
      for (const ev of this.activeEvents) {
        if (ev.until <= this.t) this.endEvent(ev); else stillActive.push(ev);
      }
      this.activeEvents = stillActive;
    }
    if (this.hasEvent('memory_leak')) this.overload = clamp(this.overload + dt * 3, 0, 100);

    // powerups lifecycle
    if (this.activePowerups.length) this.activePowerups = this.activePowerups.filter(p => p.until > this.t);

    // floating powerup spawn/expire
    this.powerupTimer -= dt;
    if (this.powerupTimer <= 0 && this.t > 12) {
      this.spawnFloatingPowerup();
      this.powerupTimer = TUNING.powerupMinGap + Math.random() * (TUNING.powerupMaxGap - TUNING.powerupMinGap);
    }
    this.floatingPowerups = this.floatingPowerups.filter(f => this.t - f.spawnedAt < 14);

    // spawning
    const frozen = this.hasPowerup('freeze_time');
    if (!frozen) {
      this.spawnTimer -= dt;
      const brokenFloppyMult = this.hasEvent('broken_floppy') ? 1.9 : 1;
      if (this.spawnTimer <= 0) {
        this.spawnWorker();
        if (this.score >= TUNING.multiSpawnScore && chance(0.32)) this.spawnWorker();
        const interval = Math.max(
          TUNING.spawnIntervalMin,
          TUNING.spawnIntervalStart - this.t * TUNING.spawnRampPerSec,
        ) * brokenFloppyMult;
        this.spawnTimer = interval;
      }
    }

    // workers
    const speedMult = this.speedMultiplier();
    const baseSpeed = Math.min(TUNING.workerSpeedMax, TUNING.workerSpeedStart + this.t * 0.008);
    const survivors: WorkerState[] = [];
    for (const w of this.workers) {
      w.animT += dt;
      if (w.anim === 'wait') {
        // retry routing every tick — cheap, and lets a just-built belt free a queued worker instantly
        this.assignRoute(w);
        if (w.anim === 'wait') {
          w.waitT += dt;
          if (w.waitT > TUNING.waitGraceSeconds) {
            this.overload = clamp(this.overload + dt * TUNING.overloadOnWaitTick, 0, 100);
          }
          if (w.waitT > TUNING.waitHardTimeout) {
            this.missed++;
            this.combo = 0;
            this.overload = clamp(this.overload + TUNING.overloadOnMissed, 0, 100);
            this.cb.onSound('workerMissed');
            this.addFloatingText(w.x, w.y, 'MISSED', '#ff6b6b');
            w.outcome = 'missed';
            w.anim = 'panic';
            w.animT = 0;
            continue;
          }
          survivors.push(w);
          continue;
        }
      }

      if (w.outcome !== 'pending') {
        // holding after arrival for its little celebration/confusion beat
        if (w.animT > 0.55) continue;
        survivors.push(w);
        continue;
      }

      const speed = (baseSpeed + (w.infected ? 0.4 : 0)) * speedMult;
      let remaining = speed * dt;
      while (remaining > 0 && w.pathIdx < w.path.length - 1) {
        const [tx, ty] = w.path[w.pathIdx + 1];
        const dx = tx - w.x, dy = ty - w.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-4) { w.pathIdx++; continue; }
        if (dist <= remaining) {
          w.x = tx; w.y = ty; w.pathIdx++;
          remaining -= dist;
        } else {
          w.x += (dx / dist) * remaining;
          w.y += (dy / dist) * remaining;
          remaining = 0;
        }
      }

      if (w.pathIdx >= w.path.length - 1) {
        // arrived — resolve against whichever module sits at the final waypoint
        const arrivedAt = MODULES.find(m => {
          const [px, py] = portOf(m.id);
          return Math.hypot(px - w.x, py - w.y) < 0.75 || (m.gx === Math.round(w.x) && m.gy === Math.round(w.y));
        });
        const resolved = this.resolveArrival(w, arrivedAt?.id ?? null);
        w.outcome = resolved;
        w.animT = 0;
        w.anim = resolved === 'correct' ? 'happy' : 'confused';
      }
      survivors.push(w);
    }
    this.workers = survivors;

    // overload decay + alarm
    if (this.overload > 0) this.overload = clamp(this.overload - TUNING.overloadDecayPerSec * dt, 0, 100);
    if (this.overload >= 100) {
      this.ended = true;
      this.cb.onSound('overloadAlarm');
      this.cb.onGameOver(this.getStats());
    }
  }

  private resolveArrival(w: WorkerState, moduleId: ModuleId | null): 'correct' | 'wrong' {
    w.resolvedModule = moduleId;
    const okModule = moduleId != null && this.moduleStates[moduleId] !== 'offline';
    const isCorrect = okModule && moduleId === w.target && !(w.infected && moduleId !== 'virusscanner');
    if (isCorrect && moduleId) {
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      const comboMult = 1 + Math.min(this.combo * TUNING.comboStep, TUNING.comboMax);
      const powerupMult = this.hasPowerup('combo_multiplier') ? 2 : 1;
      const gain = Math.round(TUNING.scorePerCorrect * comboMult * powerupMult);
      this.score += gain;
      this.correct++;
      this.moduleWorkFlash[moduleId] = 0.6;
      this.cb.onSound(this.combo > 1 && this.combo % 3 === 0 ? 'combo' : 'workerComplete');
      this.addFloatingText(w.x, w.y, `+${gain}${this.combo > 1 ? ` x${this.combo}` : ''}`, '#39ff14');
      this.checkMilestones(moduleId);
      return 'correct';
    }
    this.combo = 0;
    this.wrong++;
    this.overload = clamp(this.overload + TUNING.overloadOnWrong, 0, 100);
    this.cb.onSound('workerWrong');
    this.addFloatingText(w.x, w.y, 'WRONG', '#ffb454');
    return 'wrong';
  }

  getStats(): GameStats {
    return {
      score: this.score, combo: this.combo, bestCombo: this.bestCombo,
      overload: this.overload, correct: this.correct, wrong: this.wrong,
      missed: this.missed, elapsed: this.t, wave: Math.floor(this.t / 30) + 1,
    };
  }

  getSnapshot(): EngineSnapshot {
    return {
      workers: this.workers,
      belts: this.belts,
      moduleStates: { ...this.moduleStates },
      moduleWorkFlash: { ...this.moduleWorkFlash },
      floatingPowerups: this.floatingPowerups,
      floatingTexts: this.floatingTexts,
      activeEvents: this.activeEvents,
      activePowerups: this.activePowerups,
      stats: this.getStats(),
      iconsScrambled: this.iconsScrambled,
      spawnFlash: this.spawnFlash,
    };
  }
}
