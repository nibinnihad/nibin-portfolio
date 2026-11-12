/**
 * Swarm rebuild engine — an original implementation for this portfolio.
 *
 * A team of unseen agents rebuilds the real page block by block: boxes are
 * dragged out, text is typed, media is swept in, repeated cards are
 * duplicated. Work unlocks as the visitor scrolls. Everything is drawn on a
 * single fixed canvas from one requestAnimationFrame loop; React is not
 * re-rendered per frame.
 */

import { SWARM_APPEND_EVENT, SWARM_DEFER_ATTR, SWARM_PENDING_ATTR, SWARM_RUNNING_ATTR, SWARM_SESSION_KEY } from "./constants";
import { appendSections, docRect, measureLines, scanPage, type DocRect, type Section, type Task } from "./blueprint";

export type SwarmPhase = "scanning" | "building" | "waiting" | "finishing";

export interface SwarmStatus {
  phase: SwarmPhase;
  progress: number;
  message: string;
  colors: string[];
  /** First few teammates, for the toolbar's avatar stack. */
  team: { color: string; initial: string }[];
  agents: number;
  done: number;
  total: number;
}

interface SwarmCallbacks {
  onStatus: (status: SwarmStatus) => void;
  onFinish: () => void;
}

type Tool = "arrow" | "cross" | "beam" | "pen" | "dup";
type Stage = "idle" | "travel" | "work" | "leave";

interface Agent {
  id: number;
  color: string;
  initial: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  trail: number[];
  trailClock: number;
  stage: Stage;
  task: Task | null;
  /** Milliseconds before the agent enters (staggered arrivals). */
  wait: number;
  t: number;
  dur: number;
  tool: Tool;
  extra: boolean;
  idleFor: number;
  alpha: number;
  drag: DocRect | null;
  ghost: DocRect | null;
  caret: { x: number; y: number; h: number } | null;
  /** Caret colour: the text's own colour, so it reads on dark cards too. */
  ink: string;
  sweep: number;
  /** Finishing: this agent is flocking to the visitor's pointer, not leaving. */
  homing: boolean;
  /** Top travel speed in px/ms (quick cursors ~1-1.5, steady ones ~0.3-0.75). */
  pace: number;
  /** Heading in radians (0 = the arrow's resting tilt); eases toward the direction of travel. */
  heading: number;
  prevX: number;
  prevY: number;
  /** Idle wandering: next spot (fractions of the viewport) and time left before moving on. */
  wander: { fx: number; fy: number; hold: number };
}

interface Flash {
  rect: DocRect;
  color: string;
  age: number;
}

// Multiplayer palette, design-tool style: bright fills with a white outline.
const PALETTE = ["#0D99FF", "#9747FF", "#14AE5C", "#FF7A1A", "#F24822", "#FF24BD", "#FFC21A", "#0FB5AE"];

/** Readable badge text on a coloured chip: dark on light colours, white on the rest. */
function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? "#1a1a1a" : "#ffffff";
}
/** Teammate initials for the toolbar avatars. */
const INITIALS = "FBHTKMDRLSAJNPOVGEWC";
const GUIDE_COLOR = "#F2564B";
/** Selection colour shared by every cursor: boxes, handles and size badges. */
const SELECT = "#0D99FF";
/** Grey a box is drawn in before its real fill fades in. */
const PLACEHOLDER = "#D9D9D9";
const RULER_BG = "#2C2C2C";

const SCAN_MS = 2000; // the swarm orbits the site icon while the layout is scanned
const FINISH_MS = 2400;
const FLASH_MS = 450;
const TRAIL_POINTS = 14;
/** Trail sample spacing, so trails are the same length on 60Hz and 144Hz screens. */
const TRAIL_STEP_MS = 16;
/** No-work time before the status switches to "waiting". */
const WAIT_DELAY_MS = 350;
/** Box/media timeline: drag out the grey placeholder, then the real fill fades in over it. */
const DRAG_END = 0.55;
const FADE_END = 0.85;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const pct = (value: number) => `${(clamp(value, 0, 1) * 100).toFixed(2)}%`;

/**
 * Time to build one piece at 1x: drag + settle for boxes and media, a pen stroke for
 * lines, an option-drag for copies. Typing runs ~26ms a character, sped up for long
 * copy (x clamp(70 / n)) so a paragraph takes seconds, not minutes.
 */
/** Build speed relative to the base durations: the old pace (2) at 2x, i.e. 4. */
const BUILD_SPEED = 4;

function baseDuration(task: Task): number {
  switch (task.kind) {
    case "box":
      return 760;
    case "media":
      return 950;
    case "line":
      return 520;
    case "dup":
      return 820;
    case "text": {
      const n = Math.max(task.chars, 1);
      return clamp(n * 26 * clamp(70 / n, 0.06, 1), 300, 2600);
    }
    default:
      return 0;
  }
}

function toolFor(task: Task): Tool {
  switch (task.kind) {
    case "text":
      return "beam";
    case "line":
      return "pen";
    case "dup":
      return "dup";
    default:
      return "cross";
  }
}

export class SwarmEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private tasks: Task[] = [];
  private sections: Section[] = [];
  private agents: Agent[] = [];
  private flashes: Flash[] = [];
  private timers: number[] = [];
  private raf = 0;
  private last = 0;
  private running = false;
  private finished = false;
  private phase: SwarmPhase = "scanning";
  private phaseT = 0;
  private startedAt = 0;
  /** Time spent actually building (excludes time the visitor spends reading). */
  private builtIn = 0;
  private quietFor = 0;
  private lastStatusKey = "";
  private rulerTop: HTMLCanvasElement | null = null;
  private rulerLeft: HTMLCanvasElement | null = null;
  private rulerKey = "";
  /** Tasks not yet built; compacted as work completes so frames don't rescan the page. */
  private pending: Task[] = [];
  private pendingDone = -1;
  /** Tasks whose page position changes with scroll (pinned stage); re-measured every frame. */
  private liveTasks: Task[] = [];
  private ruler = 20;
  private sectionLabel = "";
  private done = 0;
  private spawned = 0;
  private overlay = 0;
  private vw = 1;
  private vh = 1;
  private dpr = 1;
  private sy = 0;
  private lastSy = 0;
  private scrollVel = 0;
  private dirty = false;
  private resizeObserver: ResizeObserver | null = null;
  private lastStatusAt = 0;
  private spawnCooldown = 0;
  private baseAgents = 8;
  private maxAgents = 14;
  private introAgents = 18;
  private sans = "system-ui, sans-serif";
  /** Where the swarm gathers before it starts (document coords): the hero name. */
  private gather = { x: 0, y: 0 };
  /** Last known pointer position (viewport coords; it stays put while the page scrolls). */
  private pointer: { x: number; y: number } | null = null;
  /** 0..1: how far the Figma-style rulers have slid in (only while guides are in use). */
  private rulerT = 0;
  /** The site icon the swarm orbits during the intro. */
  private icon: HTMLImageElement | null = null;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly callbacks: SwarmCallbacks) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  start() {
    try {
      sessionStorage.setItem(SWARM_SESSION_KEY, "1");
    } catch {
      /* storage unavailable: the rebuild simply plays again next visit */
    }

    document.documentElement.setAttribute(SWARM_RUNNING_ATTR, "");
    const { tasks, sections } = scanPage();
    this.tasks = tasks;
    this.sections = sections;
    this.hide(tasks);
    document.documentElement.removeAttribute(SWARM_PENDING_ATTR);

    const bodyStyle = getComputedStyle(document.body);
    this.sans = bodyStyle.fontFamily || this.sans;
    this.resize();
    this.sy = this.lastSy = window.scrollY;
    this.gather = { x: window.scrollX + this.vw / 2, y: this.sy + this.vh / 2 };
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (iconLink?.href) {
      const image = new Image();
      image.src = iconLink.href;
      this.icon = image;
    }
    // The swarm arrives right away and gathers while the layout is scanned.
    for (let index = 0; index < this.introAgents; index += 1) this.spawn(index >= this.baseAgents, 120 + index * 60);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("resize", this.onResize);
    document.addEventListener("focusin", this.onFocusIn);
    window.addEventListener(SWARM_APPEND_EVENT, this.onAppend);
    this.resizeObserver = new ResizeObserver(() => {
      this.dirty = true;
    });
    this.resizeObserver.observe(document.body);

    this.running = true;
    this.startedAt = this.last = performance.now();
    this.emitStatus(this.startedAt, true);
    if (!tasks.length) {
      this.finish(true);
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Reveal everything immediately and end the run. */
  skip() {
    this.finish(true);
  }

  /** Tear down without notifying (unmount / replay). Always leaves content visible. */
  destroy() {
    this.finish(false);
  }

  // ---------------------------------------------------------------- loop

  private frame = (now: number) => {
    if (!this.running) return;
    try {
      const dt = Math.min(50, Math.max(0, now - this.last));
      this.last = now;
      this.update(dt, now);
      if (this.running) this.draw(now);
    } catch (error) {
      console.error("[swarm] rebuild aborted", error);
      this.finish(true);
      return;
    }
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  };

  private onResize = () => {
    this.resize();
  };

  private hide(tasks: Task[]) {
    for (const task of tasks) {
      task.savedClip = task.el.style.clipPath;
      task.savedTransition = task.el.style.transition;
      task.el.dataset.swarm = "hidden";
    }
  }

  /** Deferred containers have settled: scan their contents and add them to the build. */
  private onAppend = (event: Event) => {
    const roots = (event as CustomEvent<Element[]>).detail ?? [];
    if (this.phase !== "finishing") {
      const added = appendSections(roots, this.tasks, this.sections);
      // These sit in a pinned stage: their page position moves with the scroll.
      for (const task of added) task.live = true;
      this.liveTasks.push(...added);
      this.hide(added);
      this.pendingDone = -1;
      if (added.length && this.phase === "waiting") this.setPhase("building");
    }
    for (const root of roots) root.removeAttribute(SWARM_DEFER_ATTR);
  };

  private onPointer = (event: PointerEvent) => {
    this.pointer = { x: event.clientX, y: event.clientY };
  };

  /** Keyboard users tabbing ahead get everything up to the focused element built at once. */
  private onFocusIn = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("[data-swarm]")) return;
    const rect = docRect(target);
    this.completeUpTo(rect.y + rect.h);
  };

  private completeUpTo(docY: number) {
    for (const task of this.tasks) {
      if (task.state === 2 || task.rect.y > docY) continue;
      const agent = this.agents.find((candidate) => candidate.task === task);
      if (agent) this.release(agent);
      this.complete(task, false);
    }
  }

  private resize() {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    this.baseAgents = this.vw < 640 ? 7 : this.vw < 1024 ? 9 : 11;
    this.maxAgents = this.vw < 640 ? 24 : this.vw < 1024 ? 32 : 40;
    this.introAgents = this.vw < 640 ? 12 : this.vw < 1024 ? 16 : 19;
    this.ruler = this.vw < 640 ? 16 : 20;
    this.dirty = true;
  }

  private remeasure() {
    this.dirty = false;
    for (const task of this.tasks) {
      if (task.state === 2) continue;
      task.rect = docRect(task.el);
      if (task.state === 1 && task.kind === "text" && task.lines.length) task.lines = measureLines(task.el);
    }
  }

  // ---------------------------------------------------------------- update

  private update(dt: number, now: number) {
    this.sy = window.scrollY;
    const velocity = Math.abs(this.sy - this.lastSy) / Math.max(dt, 1);
    this.lastSy = this.sy;
    this.scrollVel = this.scrollVel * 0.85 + velocity * 0.15;
    if (this.dirty) this.remeasure();
    if (this.liveTasks.length) {
      this.liveTasks = this.liveTasks.filter((task) => task.state !== 2);
      for (const task of this.liveTasks) task.rect = docRect(task.el);
    }
    this.phaseT += dt;
    if (this.phase === "scanning" || this.phase === "building") this.builtIn += dt;

    const overlayTarget =
      this.phase === "finishing" ? 0 : this.phase === "waiting" ? 0.35 : 1;
    const overlayRate = this.phase === "finishing" ? 900 : 300;
    this.overlay += clamp(overlayTarget - this.overlay, -dt / overlayRate, dt / overlayRate);

    if (this.phase === "scanning") {
      if (this.phaseT >= SCAN_MS) this.setPhase("building");
    } else if (this.phase === "finishing") {
      if (this.phaseT >= FINISH_MS) {
        this.finish(true);
        return;
      }
    } else {
      this.schedule(dt, now);
    }

    // Rulers slide in while any cursor is working in a section that snaps to guides.
    const guided = this.agents.some(
      (agent) => agent.stage === "work" && agent.task && this.sections[agent.task.section].guides.length > 0,
    );
    this.rulerT += clamp((guided && this.phase !== "finishing" ? 1 : 0) - this.rulerT, -dt / 380, dt / 260);

    this.updateAgents(dt, now);

    for (const flash of this.flashes) flash.age += dt;
    this.flashes = this.flashes.filter((flash) => flash.age < FLASH_MS);
    this.emitStatus(now, false);
  }

  private isReady(task: Task): boolean {
    if (task.parent >= 0 && !this.nearlyBuilt(this.tasks[task.parent])) return false;
    if (task.master >= 0 && this.tasks[task.master].state !== 2) return false;
    return true;
  }

  /** Built, or a box/media already ~40% dragged out: its contents can start arriving. */
  private nearlyBuilt(task: Task): boolean {
    if (task.state === 2) return true;
    if (task.state !== 1 || (task.kind !== "box" && task.kind !== "media")) return false;
    const agent = this.agents.find((candidate) => candidate.task === task);
    return !!agent && agent.stage === "work" && agent.t >= agent.dur * ((DRAG_END + FADE_END) / 2);
  }

  private schedule(dt: number, now: number) {
    const top = this.sy;
    const bottom = this.sy + this.vh;

    if (this.pendingDone !== this.done) {
      this.pending = (this.pendingDone < 0 ? this.tasks : this.pending).filter((task) => task.state !== 2);
      this.pendingDone = this.done;
    }

    // Anything the visitor has already scrolled past is finished instantly,
    // as is anything React removed mid-build (e.g. a project filter click).
    for (const task of this.pending) {
      if (task.state !== 2 && (task.rect.y + task.rect.h < top - 40 || !task.el.isConnected)) {
        const agent = this.agents.find((candidate) => candidate.task === task);
        if (agent) this.release(agent);
        this.complete(task, false);
      }
    }

    const available: Task[] = [];
    for (const task of this.pending) {
      if (task.state !== 0 || task.rect.y > bottom - 24 || !this.isReady(task)) continue;
      const section = this.sections[task.section];
      if (!section.started) this.startSection(section, now);
      if (task.kind === "fade") this.revealFade(task);
      else available.push(task);
    }

    // Idle agents claim nearby work, top of the page first.
    for (const agent of this.agents) {
      if (agent.wait > 0 || agent.stage !== "idle" || !available.length) continue;
      let best = 0;
      let bestDistance = Infinity;
      for (let index = 0; index < Math.min(4, available.length); index += 1) {
        const candidate = available[index];
        const distance = Math.hypot(candidate.rect.x - agent.x, candidate.rect.y - agent.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      }
      this.assign(agent, available.splice(best, 1)[0]);
    }

    // Crowd size follows the work: one more cursor per two waiting pieces, plus one per
    // 40px/s of scroll, so a busy screen fills with cursors and a quiet one thins out.
    this.spawnCooldown -= dt;
    const active = this.agents.filter((agent) => agent.stage !== "leave").length;
    const wanted = Math.min(
      this.maxAgents,
      this.baseAgents + Math.floor((this.scrollVel * 1000) / 40) + available.length,
    );
    if (active < wanted && this.spawnCooldown <= 0) {
      this.spawn(true, 0);
      this.spawnCooldown = 25;
    }

    if (this.done >= this.tasks.length) {
      this.setPhase("finishing");
      for (const agent of this.agents) this.sendHome(agent);
      return;
    }

    // Hysteresis: one empty frame between tasks shouldn't flip the status.
    const busy = this.agents.some((agent) => agent.task) || available.length > 0;
    this.quietFor = busy ? 0 : this.quietFor + dt;
    const next = busy ? "building" : this.quietFor >= WAIT_DELAY_MS ? "waiting" : this.phase;
    if (next !== this.phase) this.setPhase(next);
  }

  private startSection(section: Section, now: number) {
    section.started = true;
    section.startedAt = now;
    // Fixed 1x pace everywhere: a busy section gets more cursors, not faster ones.
    section.speed = 1;
  }

  private assign(agent: Agent, task: Task) {
    task.state = 1;
    agent.task = task;
    agent.stage = "travel";
    agent.t = 0;
    agent.tool = "arrow";
    agent.idleFor = 0;
    if (task.kind === "dup" && task.master >= 0) {
      const master = this.tasks[task.master].rect;
      agent.tx = master.x + master.w / 2;
      agent.ty = master.y + master.h / 2;
    } else {
      agent.tx = task.rect.x;
      agent.ty = task.rect.y;
    }
  }

  private release(agent: Agent) {
    agent.task = null;
    agent.stage = "idle";
    agent.drag = agent.ghost = agent.caret = null;
    agent.tool = "arrow";
  }

  private beginWork(agent: Agent, task: Task) {
    const speed = this.sections[task.section].speed;
    agent.stage = "work";
    agent.t = 0;
    agent.dur = baseDuration(task) / speed;
    agent.tool = toolFor(task);

    if (task.kind === "text") {
      task.lines = measureLines(task.el);
      agent.ink = getComputedStyle(task.el).color || "#1a1a1a";
    }
    if (task.kind !== "dup") {
      const style = task.el.style;
      style.transition = "none";
      style.clipPath = "inset(0 100% 100% 0)";
      task.el.dataset.swarm = "building";
    }
  }

  private complete(task: Task, flash: boolean, color = "#ffffff") {
    if (task.state === 2) return;
    task.el.style.clipPath = task.savedClip;
    task.el.style.transition = task.savedTransition;
    delete task.el.dataset.swarm;
    task.state = 2;
    this.done += 1;
    if (flash) this.flashes.push({ rect: { ...task.rect }, color, age: 0 });
  }

  private revealFade(task: Task) {
    const { el } = task;
    el.style.transition = "opacity 480ms ease";
    delete el.dataset.swarm;
    task.state = 2;
    this.done += 1;
    this.timers.push(
      window.setTimeout(() => {
        if (el.style.transition === "opacity 480ms ease") el.style.transition = task.savedTransition;
      }, 520),
    );
  }

  // ---------------------------------------------------------------- agents

  private spawn(extra: boolean, wait: number) {
    const n = this.spawned;
    this.spawned += 1;
    const r = (n * 0.618034) % 1;
    const sx = window.scrollX;
    const side = n % 4;
    const x =
      side === 0 ? sx - 30 : side === 1 ? sx + this.vw + 30 : sx + this.vw * (0.15 + 0.7 * r);
    const y =
      side === 0 || side === 1
        ? this.sy + this.vh * (0.2 + 0.6 * r)
        : side === 2
          ? this.sy + this.vh + 30
          : this.sy - 30;

    this.agents.push({
      id: n,
      color: PALETTE[n % PALETTE.length],
      initial: INITIALS[n % INITIALS.length],
      x,
      y,
      tx: x,
      ty: y,
      trail: [],
      trailClock: 0,
      stage: "idle",
      task: null,
      wait,
      t: 0,
      dur: 0,
      tool: "arrow",
      extra,
      idleFor: 0,
      alpha: 0,
      drag: null,
      ghost: null,
      caret: null,
      ink: "#1a1a1a",
      sweep: 0,
      homing: false,
      pace: (n * 0.381966) % 1 < 0.25 ? 1 + ((n * 0.7548) % 1) * 0.5 : 0.3 + ((n * 0.5698) % 1) * 0.45,
      wander: { fx: 0.5, fy: 0.6, hold: 0 },
      heading: 0,
      prevX: x,
      prevY: y,
    });
  }

  private sendAway(agent: Agent) {
    if (agent.task && agent.task.state !== 2) this.complete(agent.task, false);
    this.release(agent);
    agent.stage = "leave";
    agent.t = 0;
    const sx = window.scrollX;
    agent.tx = agent.x - sx < this.vw / 2 ? sx - 80 : sx + this.vw + 80;
    agent.ty = agent.y + (agent.id % 2 ? -60 : 60);
  }

  /** End of the run: flock to the visitor's pointer (or mid-screen) and fade out there. */
  private sendHome(agent: Agent) {
    if (agent.task && agent.task.state !== 2) this.complete(agent.task, false);
    this.release(agent);
    agent.stage = "leave";
    agent.homing = true;
    agent.t = 0;
    const view = this.pointer ?? { x: this.vw / 2, y: this.vh * 0.6 };
    const home = { x: window.scrollX + view.x, y: this.sy + view.y };
    const angle = agent.id * 2.39996;
    agent.tx = home.x + Math.cos(angle) * (14 + (agent.id % 3) * 9);
    agent.ty = home.y + Math.sin(angle) * (12 + (agent.id % 3) * 7);
  }

  /** Eased approach with a speed cap; returns true once close to the target. */
  private moveTo(agent: Agent, tx: number, ty: number, dt: number, maxSpeed: number): boolean {
    const dx = tx - agent.x;
    const dy = ty - agent.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.5) return true;
    const step = Math.min(distance, distance * (1 - Math.exp(-dt / 110)) + 0.4, maxSpeed * dt);
    agent.x += (dx / distance) * step;
    agent.y += (dy / distance) * step;
    return distance - step < 3;
  }

  private follow(agent: Agent, tx: number, ty: number, dt: number) {
    const k = 1 - Math.exp(-dt / 40);
    agent.x += (tx - agent.x) * k;
    agent.y += (ty - agent.y) * k;
  }

  private updateAgents(dt: number, now: number) {
    const sx = window.scrollX;

    for (const agent of this.agents) {
      if (agent.wait > 0) {
        agent.wait -= dt;
        continue;
      }
      // Work runs on the build clock; travel and the finale on real time.
      agent.t += agent.stage === "work" ? dt * BUILD_SPEED : dt;
      const leaving = agent.stage === "leave" && (!agent.homing || agent.t > FINISH_MS * 0.55);
      const fadeTarget = leaving ? 0 : this.phase === "waiting" && !agent.task ? 0.55 : 1;
      agent.alpha += clamp(fadeTarget - agent.alpha, -dt / 400, dt / 250);

      switch (agent.stage) {
        case "travel": {
          const task = agent.task;
          if (!task) {
            this.release(agent);
            break;
          }
          const arrived = this.moveTo(agent, agent.tx, agent.ty, dt, agent.pace * Math.sqrt(BUILD_SPEED));
          if (arrived || agent.t > 900) this.beginWork(agent, task);
          break;
        }
        case "work":
          this.work(agent, dt);
          break;
        case "leave":
          this.moveTo(agent, agent.tx, agent.ty, dt, agent.homing ? 1.6 : 2.4);
          break;
        default: {
          // Idle: while the layout is scanned the swarm circles the hero name; after that
          // free cursors wander between spots on screen (riding along with the scroll),
          // pausing 0.4-1.4s at each, so the crowd stays spread out and busy-looking.
          agent.idleFor += dt;
          let tx: number;
          let ty: number;
          if (this.phase === "scanning") {
            // Three ribbons of cursors orbit the site icon at different radii and speeds.
            const group = agent.id % 3;
            const slot = Math.floor(agent.id / 3);
            const radius = 95 + group * 38 + Math.sin(now * 0.0017 + agent.id) * 10;
            const angle = group * 2.1 + slot * 0.2 + now * (0.0013 - group * 0.00025) * (group === 1 ? -1 : 1);
            tx = this.gather.x + Math.cos(angle) * radius * 1.35;
            ty = this.gather.y + Math.sin(angle) * radius;
          } else {
            agent.wander.hold -= dt;
            if (agent.wander.hold <= 0) {
              agent.wander = { fx: 0.1 + Math.random() * 0.8, fy: 0.15 + Math.random() * 0.7, hold: 400 + Math.random() * 1000 };
            }
            tx = sx + this.vw * agent.wander.fx;
            ty = this.sy + this.vh * agent.wander.fy;
          }
          for (const other of this.agents) {
            if (other === agent || other.wait > 0) continue;
            const dx = agent.x - other.x;
            const dy = agent.y - other.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < 28) {
              tx += (dx / distance) * 20;
              ty += (dy / distance) * 20;
            }
          }
          this.moveTo(agent, tx, ty, dt, Math.max(0.35, agent.pace * 0.7));
          if (agent.extra && agent.idleFor > 2500 && this.phase !== "finishing") this.sendAway(agent);
        }
      }

      // Arrows turn toward where they are heading (the glyph rests tilted ~-23deg).
      const mx = agent.x - agent.prevX;
      const my = agent.y - agent.prevY;
      agent.prevX = agent.x;
      agent.prevY = agent.y;
      if (Math.hypot(mx, my) > 0.6 && agent.stage !== "work") {
        let diff = Math.atan2(my, mx) + (Math.PI * 3) / 4 - agent.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        agent.heading += diff * (1 - Math.exp(-dt / 90));
      } else if (agent.stage === "work") {
        agent.heading *= Math.exp(-dt / 120);
      }

      agent.trailClock += dt;
      if (agent.trailClock >= TRAIL_STEP_MS) {
        agent.trailClock %= TRAIL_STEP_MS;
        agent.trail.push(agent.x, agent.y);
        if (agent.trail.length > TRAIL_POINTS * 2) agent.trail.splice(0, agent.trail.length - TRAIL_POINTS * 2);
      }
    }

    this.agents = this.agents.filter(
      (agent) =>
        agent.stage !== "leave" ||
        (agent.homing && agent.t < FINISH_MS) ||
        (agent.t < 1600 &&
          agent.x > sx - 60 &&
          agent.x < sx + this.vw + 60 &&
          agent.y > this.sy - 120 &&
          agent.y < this.sy + this.vh + 120),
    );
  }

  private work(agent: Agent, dt: number) {
    const task = agent.task;
    if (!task) {
      this.release(agent);
      return;
    }
    const p = clamp(agent.t / Math.max(agent.dur, 1), 0, 1);
    const { x, y, w, h } = task.rect;
    const style = task.el.style;

    switch (task.kind) {
      case "box": {
        // Crosshair-drag a grey placeholder, then the real fill fades in over it.
        const e = ease(Math.min(1, p / DRAG_END));
        if (p >= DRAG_END && style.clipPath !== task.savedClip) style.clipPath = task.savedClip;
        agent.drag = { x, y, w: w * e, h: h * e };
        agent.sweep = clamp((p - DRAG_END) / (FADE_END - DRAG_END), 0, 1);
        this.follow(agent, x + w * e, y + h * e, dt);
        break;
      }
      case "media": {
        if (p < DRAG_END) {
          const e = ease(p / DRAG_END);
          agent.drag = { x, y, w: w * e, h: h * e };
          agent.sweep = 0;
          this.follow(agent, x + w * e, y + h * e, dt);
        } else {
          const s = ease((p - DRAG_END) / (1 - DRAG_END));
          style.clipPath = `inset(0 0 ${pct(1 - s)} 0)`;
          agent.drag = { x, y, w, h };
          agent.sweep = s;
          this.follow(agent, x + w, y + h * s, dt);
        }
        break;
      }
      case "line": {
        const e = ease(p);
        style.clipPath = w >= h ? `inset(0 ${pct(1 - e)} 0 0)` : `inset(0 0 ${pct(1 - e)} 0)`;
        agent.drag = { x, y, w: w >= h ? w * e : w, h: w >= h ? h : h * e };
        this.follow(agent, x + agent.drag.w, y + agent.drag.h, dt);
        break;
      }
      case "dup": {
        const master = this.tasks[task.master].rect;
        const e = ease(Math.min(1, p / 0.8));
        const ghost = {
          x: master.x + (x - master.x) * e,
          y: master.y + (y - master.y) * e,
          w,
          h,
        };
        agent.ghost = ghost;
        agent.drag = master;
        if (p >= 0.8 && task.el.dataset.swarm === "hidden") {
          style.transition = "none";
          task.el.dataset.swarm = "building";
        }
        this.follow(agent, ghost.x + Math.min(w * 0.5, 60), ghost.y + Math.min(h * 0.5, 40), dt);
        break;
      }
      case "text": {
        if (p < 0.12) {
          const e = ease(p / 0.12);
          agent.drag = { x, y, w: w * e, h: h * e };
          agent.caret = null;
          this.follow(agent, x + w * e, y + h * e, dt);
          break;
        }
        agent.drag = { x, y, w, h };
        const q = (p - 0.12) / 0.88;
        const lines = task.lines;
        const total = lines.reduce((sum, line) => sum + (line.right - line.left), 0);
        const chars = Math.max(1, task.chars);
        let remaining = (Math.floor(q * chars) / chars) * total;
        let index = 0;
        while (index < lines.length - 1 && remaining > lines[index].right - lines[index].left) {
          remaining -= lines[index].right - lines[index].left;
          index += 1;
        }
        const line = lines[index];
        const cx = line.left + Math.min(remaining, line.right - line.left);
        const top = line.top - 2;
        const bottom = line.bottom + 2;
        style.clipPath = `polygon(0 0, 100% 0, 100% ${top}px, ${cx}px ${top}px, ${cx}px ${bottom}px, 0 ${bottom}px)`;
        agent.caret = { x: x + cx, y: y + line.top, h: line.bottom - line.top };
        this.follow(agent, x + cx + 3, y + (line.top + line.bottom) / 2, dt);
        break;
      }
      default:
        break;
    }

    if (p >= 1) {
      this.complete(task, true, agent.color);
      this.release(agent);
    }
  }

  // ---------------------------------------------------------------- status

  private setPhase(phase: SwarmPhase) {
    this.phase = phase;
    this.phaseT = 0;
    this.emitStatus(performance.now(), true);
  }

  private emitStatus(now: number, force: boolean) {
    if (!force && now - this.lastStatusAt < 120) return;
    this.lastStatusAt = now;

    // Stable wording: the team size and the section being built, not the
    // number of cursors busy this instant (which jitters every frame).
    const team = this.agents.filter((agent) => agent.stage !== "leave" && agent.wait <= 0);
    let topmost: Task | null = null;
    for (const agent of this.agents) {
      if (agent.task && (!topmost || agent.task.rect.y < topmost.rect.y)) topmost = agent.task;
    }
    if (topmost) this.sectionLabel = this.sections[topmost.section].label;

    let message: string;
    switch (this.phase) {
      case "scanning":
        message = "Scanning page…";
        break;
      case "waiting":
        message = "Waiting";
        break;
      case "finishing":
        message = `Rebuilt by ${this.spawned} cursors in ${(this.builtIn / 1000).toFixed(1)}s`;
        break;
      default:
        message = `Building${this.sectionLabel ? ` ${this.sectionLabel}` : ""} · ${team.length} ${team.length === 1 ? "cursor" : "cursors"}`;
    }

    const status: SwarmStatus = {
      phase: this.phase,
      progress: this.tasks.length ? Math.round((this.done / this.tasks.length) * 100) / 100 : 1,
      message,
      colors: team.slice(0, 5).map((agent) => agent.color),
      team: team.slice(0, 5).map((agent) => ({ color: agent.color, initial: agent.initial })),
      agents: team.length,
      done: this.done,
      total: this.tasks.length,
    };
    // Only re-render the HUD when something visible changed.
    const key = `${status.phase}|${status.done}|${status.agents}|${status.message}|${status.colors.join()}`;
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    this.callbacks.onStatus(status);
  }

  private finish(notify: boolean) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    for (const timer of this.timers) window.clearTimeout(timer);
    for (const task of this.tasks) {
      if (task.state === 2) continue;
      task.el.style.clipPath = task.savedClip;
      task.el.style.transition = task.savedTransition;
      delete task.el.dataset.swarm;
      task.state = 2;
    }
    document.documentElement.removeAttribute(SWARM_PENDING_ATTR);
    document.documentElement.removeAttribute(SWARM_RUNNING_ATTR);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    document.removeEventListener("focusin", this.onFocusIn);
    window.removeEventListener(SWARM_APPEND_EVENT, this.onAppend);
    for (const el of Array.from(document.querySelectorAll(`[${SWARM_DEFER_ATTR}]`))) el.removeAttribute(SWARM_DEFER_ATTR);
    this.resizeObserver?.disconnect();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (notify) this.callbacks.onFinish();
  }

  // ---------------------------------------------------------------- drawing

  private draw(now: number) {
    const { ctx, vw, vh, sy } = this;
    const sx = window.scrollX;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    const o = clamp(this.overlay, 0, 1);
    this.drawIcon(now);

    ctx.save();
    ctx.translate(-sx, -sy);
    if (o > 0.01) this.drawGuides(o, now);
    this.drawFlashes();
    this.drawWork(now);
    if (this.rulerT > 0.01) this.drawMeasures();
    ctx.restore();

    if (this.rulerT > 0.01) this.drawRulers(ease(this.rulerT), sx);
  }

  /** Intro: the site icon sits mid-screen on the blank page while the swarm orbits it. */
  private drawIcon(now: number) {
    const fadeIn = this.phase === "scanning" ? clamp(this.phaseT / 300, 0, 1) : 0;
    const fadeOut = this.phase === "building" || this.phase === "waiting" ? 1 - clamp(this.phaseT / 350, 0, 1) : 0;
    const a = Math.max(fadeIn, fadeOut);
    if (a <= 0.01) return;
    const { ctx } = this;
    const cx = this.gather.x - window.scrollX;
    const cy = this.gather.y - this.sy;
    const size = 46 * (0.9 + 0.1 * a) * (1 + Math.sin(now * 0.004) * 0.015);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = "rgba(0,0,0,0.14)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 11);
    ctx.fill();
    ctx.shadowColor = "transparent";
    if (this.icon?.complete && this.icon.naturalWidth) {
      const inner = size * 0.62;
      ctx.drawImage(this.icon, cx - inner / 2, cy - inner / 2, inner, inner);
    } else {
      ctx.fillStyle = "#a3a3a3";
      ctx.beginPath();
      ctx.roundRect(cx - size * 0.3, cy - size * 0.3, size * 0.6, size * 0.6, 6);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Figma-style dotted measurements from each piece being built back to the rulers. */
  private drawMeasures() {
    const { ctx } = this;
    const sx = window.scrollX;
    const top = this.sy + this.ruler * ease(this.rulerT);
    const left = sx + this.ruler * ease(this.rulerT);
    ctx.save();
    ctx.globalAlpha = ease(this.rulerT) * 0.85;
    ctx.strokeStyle = SELECT;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (const agent of this.agents) {
      if (agent.stage !== "work" || !agent.drag) continue;
      const r = agent.drag;
      const mx = Math.round(r.x + r.w / 2) + 0.5;
      const my = Math.round(r.y + r.h / 2) + 0.5;
      if (r.y > top) {
        ctx.moveTo(mx, top);
        ctx.lineTo(mx, r.y);
      }
      if (r.x > left) {
        ctx.moveTo(left, my);
        ctx.lineTo(r.x, my);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawGuides(o: number, now: number) {
    const { ctx, sy, vh } = this;
    const sx = window.scrollX;
    for (const section of this.sections) {
      if (!section.started || !section.guides.length) continue;
      const active = this.agents.some((agent) => agent.task?.section === section.index);
      const age = now - section.startedAt;
      if (!active && age > 2600) continue;
      const slide = ease(Math.min(1, age / 450));
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.globalAlpha = 0.9 * o * ease(this.rulerT) * (active ? 1 : 0.45);
      ctx.lineWidth = 1;
      for (const gx of section.guides) {
        const x = sx + (gx - sx) * slide;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, sy + this.ruler);
        ctx.lineTo(Math.round(x) + 0.5, sy + vh);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawFlashes() {
    const { ctx } = this;
    ctx.lineWidth = 1;
    for (const flash of this.flashes) {
      ctx.globalAlpha = (1 - flash.age / FLASH_MS) * 0.7;
      ctx.strokeStyle = flash.color;
      ctx.strokeRect(flash.rect.x + 0.5, flash.rect.y + 0.5, flash.rect.w, flash.rect.h);
    }
    ctx.globalAlpha = 1;
  }

  private badge(text: string, x: number, y: number, color: string, fg = inkOn(color)) {
    const { ctx } = this;
    ctx.font = `600 10px ${this.sans}`;
    const width = ctx.measureText(text).width + 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(Math.round(x - width / 2), Math.round(y), width, 15, 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, Math.round(x), Math.round(y) + 8);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  private handles(rect: DocRect, color: string) {
    const { ctx } = this;
    const corners: [number, number][] = [
      [rect.x, rect.y],
      [rect.x + rect.w, rect.y],
      [rect.x, rect.y + rect.h],
      [rect.x + rect.w, rect.y + rect.h],
    ];
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (const [cx, cy] of corners) {
      const hx = Math.round(cx) - 3.5;
      const hy = Math.round(cy) - 3.5;
      ctx.fillRect(hx, hy, 7, 7);
      ctx.strokeRect(hx + 0.5, hy + 0.5, 6, 6);
    }
  }

  private drawWork(now: number) {
    const { ctx } = this;
    for (const agent of this.agents) {
      const task = agent.task;
      if (!task || agent.stage !== "work" || !agent.drag) continue;
      const rect = agent.drag;
      ctx.lineWidth = 1;
      ctx.strokeStyle = SELECT;

      switch (task.kind) {
        case "box": {
          // Solid grey placeholder; the real fill fades in under it once the drag ends.
          const big = task.rect.w * task.rect.h > this.vw * this.vh * 0.35;
          ctx.fillStyle = PLACEHOLDER;
          ctx.globalAlpha = (big ? 0.75 : 1) * (1 - agent.sweep);
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          ctx.globalAlpha = 1;
          ctx.strokeRect(Math.round(rect.x) + 0.5, Math.round(rect.y) + 0.5, Math.round(rect.w), Math.round(rect.h));
          this.handles(rect, SELECT);
          this.badge(`${Math.round(rect.w)} × ${Math.round(rect.h)}`, rect.x + rect.w / 2, rect.y + rect.h + 6, SELECT);
          break;
        }
        case "media": {
          // Grey placeholder with an image glyph; the image then sweeps in top to bottom.
          const cut = rect.y + rect.h * agent.sweep;
          ctx.fillStyle = PLACEHOLDER;
          ctx.fillRect(rect.x, cut, rect.w, rect.y + rect.h - cut);
          if (agent.sweep < 0.5 && rect.w > 40 && rect.h > 30) {
            const gx = rect.x + rect.w / 2;
            const gy = rect.y + rect.h / 2;
            ctx.strokeStyle = "#9a9a9a";
            ctx.lineWidth = 1.25;
            ctx.strokeRect(gx - 9, gy - 7, 18, 14);
            ctx.beginPath();
            ctx.moveTo(gx - 7, gy + 5);
            ctx.lineTo(gx - 2, gy);
            ctx.lineTo(gx + 2, gy + 3);
            ctx.lineTo(gx + 4, gy + 1);
            ctx.lineTo(gx + 7, gy + 5);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = SELECT;
          }
          ctx.strokeRect(Math.round(rect.x) + 0.5, Math.round(rect.y) + 0.5, Math.round(rect.w), Math.round(rect.h));
          this.handles(rect, SELECT);
          this.badge(`${Math.round(rect.w)} × ${Math.round(rect.h)}`, rect.x + rect.w / 2, rect.y + rect.h + 6, SELECT);
          break;
        }
        case "line":
          ctx.strokeStyle = agent.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(task.rect.x, task.rect.y + 0.5);
          ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          for (const [px, py] of [
            [task.rect.x, task.rect.y],
            [rect.x + rect.w, rect.y + rect.h],
          ]) {
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          break;
        case "dup": {
          const ghost = agent.ghost;
          ctx.setLineDash([4, 4]);
          ctx.globalAlpha = 0.6;
          ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
          if (ghost) {
            ctx.globalAlpha = 0.95;
            ctx.strokeRect(ghost.x + 0.5, ghost.y + 0.5, ghost.w, ghost.h);
            ctx.setLineDash([]);
            this.drawSpacing(rect, ghost);
          }
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          break;
        }
        case "text":
          ctx.strokeRect(Math.round(rect.x) + 0.5, Math.round(rect.y) + 0.5, Math.round(rect.w), Math.round(rect.h));
          if (!agent.caret) {
            // Still dragging the text box out.
            this.handles(rect, SELECT);
            this.badge(`${Math.round(rect.w)} × ${Math.round(rect.h)}`, rect.x + rect.w / 2, rect.y + rect.h + 6, SELECT);
          } else if (Math.floor(now / 420) % 2 === 0) {
            ctx.fillStyle = agent.ink;
            ctx.fillRect(Math.round(agent.caret.x), agent.caret.y, 1.25, agent.caret.h);
          }
          break;
        default:
          break;
      }
    }
  }

  /** Red spacing measurement between a master and its duplicate. */
  private drawSpacing(master: DocRect, ghost: DocRect) {
    const { ctx } = this;
    let label = "";
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ghost.y >= master.y + master.h) {
      const gap = ghost.y - (master.y + master.h);
      const x = ghost.x + ghost.w / 2;
      ctx.moveTo(x, master.y + master.h);
      ctx.lineTo(x, ghost.y);
      label = `${Math.round(gap)}`;
      ctx.stroke();
      if (gap > 2) this.badge(label, x, master.y + master.h + gap / 2 - 7, GUIDE_COLOR, "#ffffff");
    } else if (ghost.x >= master.x + master.w) {
      const gap = ghost.x - (master.x + master.w);
      const y = ghost.y + Math.min(ghost.h / 2, 40);
      ctx.moveTo(master.x + master.w, y);
      ctx.lineTo(ghost.x, y);
      label = `${Math.round(gap)}`;
      ctx.stroke();
      if (gap > 2) this.badge(label, master.x + master.w + gap / 2, y - 18, GUIDE_COLOR, "#ffffff");
    }
  }

  /**
   * Ruler background, ticks and labels only change with scroll or resize, so
   * they are rendered into an offscreen canvas and reused across frames.
   */
  private strip(canvas: HTMLCanvasElement | null, width: number, height: number) {
    const strip = canvas ?? document.createElement("canvas");
    const w = Math.round(width * this.dpr);
    const h = Math.round(height * this.dpr);
    if (strip.width !== w || strip.height !== h) {
      strip.width = w;
      strip.height = h;
    }
    const c = strip.getContext("2d");
    if (c) {
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, width, height);
      c.fillStyle = RULER_BG;
      c.fillRect(0, 0, width, height);
      c.strokeStyle = "rgba(255,255,255,0.28)";
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.font = `9px ${this.sans}`;
      c.lineWidth = 1;
      c.beginPath();
    }
    return { strip, c };
  }

  /**
   * Ruler ticks and labels only change with scroll or resize, so the two
   * ruler strips are rendered offscreen and reused across frames.
   */
  private renderRulers(sx: number) {
    const { vw, vh, sy, ruler, dpr } = this;
    const key = `${Math.round(sx)}|${Math.round(sy)}|${vw}|${vh}|${ruler}|${dpr}`;
    if (key === this.rulerKey && this.rulerTop && this.rulerLeft) return;
    this.rulerKey = key;
    const tick = (doc: number) => Math.min(doc % 100 === 0 ? 10 : doc % 50 === 0 ? 6 : 3, ruler - 2);

    const top = this.strip(this.rulerTop, vw, ruler);
    this.rulerTop = top.strip;
    if (top.c) {
      for (let docX = Math.floor(sx / 10) * 10; docX <= sx + vw; docX += 10) {
        const x = Math.round(docX - sx) + 0.5;
        if (x < ruler) continue;
        top.c.moveTo(x, ruler);
        top.c.lineTo(x, ruler - tick(docX));
        if (docX % 100 === 0) top.c.fillText(String(docX), x + 3, 10);
      }
      top.c.moveTo(0, ruler - 0.5);
      top.c.lineTo(vw, ruler - 0.5);
      top.c.stroke();
    }

    const left = this.strip(this.rulerLeft, ruler, vh);
    this.rulerLeft = left.strip;
    if (left.c) {
      for (let docY = Math.floor(sy / 10) * 10; docY <= sy + vh; docY += 10) {
        const y = Math.round(docY - sy) + 0.5;
        if (y < ruler) continue;
        left.c.moveTo(ruler, y);
        left.c.lineTo(ruler - tick(docY), y);
        if (docY % 100 === 0) {
          left.c.save();
          left.c.translate(11, y - 3);
          left.c.rotate(-Math.PI / 2);
          left.c.fillText(String(docY), 0, 0);
          left.c.restore();
        }
      }
      left.c.moveTo(ruler - 0.5, ruler);
      left.c.lineTo(ruler - 0.5, vh);
      left.c.stroke();
    }
  }

  /** Rulers slide in from the edges (o = 0..1), with the extents of the work in progress in blue. */
  private drawRulers(o: number, sx: number) {
    const { ctx, vw, vh, sy, ruler } = this;
    this.renderRulers(sx);
    const shift = -(1 - o) * ruler;
    ctx.save();
    ctx.globalAlpha = Math.min(1, o * 1.4);
    if (this.rulerLeft) ctx.drawImage(this.rulerLeft, shift, 0, ruler, vh);
    if (this.rulerTop) ctx.drawImage(this.rulerTop, 0, shift, vw, ruler);

    ctx.font = `600 9px ${this.sans}`;
    for (const agent of this.agents) {
      const r = agent.drag;
      if (!r || agent.stage !== "work") continue;
      const x0 = r.x - sx;
      const y0 = r.y - sy;
      ctx.fillStyle = "rgba(13,153,255,0.32)";
      ctx.fillRect(x0, shift, r.w, ruler);
      ctx.fillRect(shift, Math.max(ruler, y0), ruler, r.h);
      ctx.fillStyle = "#4DB5FF";
      ctx.fillText(String(Math.round(r.x)), x0 + 3, shift + 10);
      if (r.w > 40) ctx.fillText(String(Math.round(r.x + r.w)), x0 + r.w + 3, shift + 10);
    }

    // Guide markers on the top ruler.
    ctx.fillStyle = GUIDE_COLOR;
    for (const section of this.sections) {
      if (!section.started) continue;
      if (!this.agents.some((agent) => agent.task?.section === section.index)) continue;
      for (const gx of section.guides) {
        const x = gx - sx;
        ctx.beginPath();
        ctx.moveTo(x - 4, shift + ruler - 6);
        ctx.lineTo(x + 4, shift + ruler - 6);
        ctx.lineTo(x, shift + ruler);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Corner square where the rulers meet.
    ctx.fillStyle = RULER_BG;
    ctx.fillRect(shift, shift, ruler, ruler);
    ctx.restore();
  }
}
