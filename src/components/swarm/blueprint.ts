/**
 * Blueprint: scans the rendered page and turns it into an ordered list of
 * build tasks. The real DOM is never cloned or rewritten — each task only
 * points at an existing element that the engine hides and later reveals.
 */

export type TaskKind = "box" | "media" | "text" | "line" | "dup" | "fade";

export type BuildElement = HTMLElement | SVGElement;

/** Rectangle in document coordinates (scroll-independent). */
export interface DocRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A rendered line of text, relative to its element's border box. */
export interface TextLine {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Task {
  id: number;
  el: BuildElement;
  kind: TaskKind;
  section: number;
  /** Enclosing box task that must be built first, or -1. */
  parent: number;
  /** For duplicates: the master task copied from, or -1. */
  master: number;
  rect: DocRect;
  chars: number;
  /** 0 = pending, 1 = assigned / building, 2 = built. */
  state: 0 | 1 | 2;
  lines: TextLine[];
  savedClip: string;
  savedTransition: string;
  /** Inside a pinned (sticky) or moving container: re-measured every frame until built. */
  live?: boolean;
}

export interface Section {
  index: number;
  label: string;
  tasks: number[];
  /** Shared left edges (document x) that get a ruler guide. */
  guides: number[];
  started: boolean;
  startedAt: number;
  speed: number;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Introduction",
  about: "About",
  slider: "Code to reality",
  projects: "Projects",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
  contact: "Contact",
};

const SKIP_TAGS = new Set(["script", "style", "noscript", "template", "br", "option"]);
const MEDIA_TAGS = new Set(["img", "picture", "video", "canvas", "iframe"]);
const FIELD_TAGS = new Set(["input", "textarea", "select"]);
const TASK_BUDGET = 120;

export function docRect(el: Element): DocRect {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    w: rect.width,
    h: rect.height,
  };
}

function alphaOf(color: string): number {
  if (!color || color === "transparent") return 0;
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return 1;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length >= 4 ? parseFloat(parts[3]) : 1;
}

function isPainted(style: CSSStyleDeclaration): boolean {
  if (alphaOf(style.backgroundColor) > 0.01 || style.backgroundImage !== "none") return true;
  return ["top", "right", "bottom", "left"].some(
    (side) =>
      parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 &&
      alphaOf(style.getPropertyValue(`border-${side}-color`)) > 0.01,
  );
}

interface NodeInfo {
  style: CSSStyleDeclaration;
  rect: DOMRect;
  hasText: boolean;
  /** Text flows inline throughout, so the element can be typed as one block. */
  textLeaf: boolean;
}

/**
 * One bottom-up pass that reads each element's style and box exactly once.
 * (Checking text flow per element against all its descendants is quadratic
 * and caused visible jank at startup.)
 */
function analyze(el: Element, out: Map<Element, NodeInfo>): NodeInfo {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  let hasText = false;
  let blockText = false;

  if (el.tagName.toLowerCase() !== "svg") {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) hasText = true;
    }
    for (const child of Array.from(el.children)) {
      if (SKIP_TAGS.has(child.tagName.toLowerCase())) continue;
      const info = analyze(child, out);
      if (!info.hasText) continue;
      hasText = true;
      const display = info.style.display;
      if (!info.textLeaf || (!display.startsWith("inline") && display !== "contents")) blockText = true;
    }
  }

  const info = { style, rect, hasText, textLeaf: hasText && !blockText };
  out.set(el, info);
  return info;
}

export function measureLines(el: Element): TextLine[] {
  const box = el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  const lines: TextLine[] = [];

  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width < 1 || rect.height < 1) continue;
    const top = rect.top - box.top;
    const bottom = rect.bottom - box.top;
    // Skip lines hidden by line-clamp / overflow, and clamp truncated lines,
    // so typing never runs outside the visible box.
    if (top >= box.height - 1) continue;
    const left = Math.max(0, rect.left - box.left);
    const right = Math.min(box.width, rect.right - box.left);
    if (right - left < 1) continue;
    const mid = (top + bottom) / 2;
    const line = lines.find((candidate) => mid > candidate.top && mid < candidate.bottom);
    if (line) {
      line.top = Math.min(line.top, top);
      line.bottom = Math.max(line.bottom, bottom);
      line.left = Math.min(line.left, left);
      line.right = Math.max(line.right, right);
    } else {
      lines.push({ top, bottom, left, right });
    }
  }
  range.detach();

  lines.sort((a, b) => a.top - b.top);
  return lines.length ? lines : [{ top: 0, bottom: box.height, left: 0, right: box.width }];
}

function scanSection(root: Element, sectionIndex: number, tasks: Task[]): number[] {
  const ids: number[] = [];
  const infos = new Map<Element, NodeInfo>();
  analyze(root, infos);
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  const add = (el: BuildElement, kind: TaskKind, parent: number, chars = 0): Task => {
    const box = infos.get(el)?.rect ?? el.getBoundingClientRect();
    const task: Task = {
      id: tasks.length,
      el,
      kind,
      section: sectionIndex,
      parent,
      master: -1,
      rect: { x: box.left + scrollX, y: box.top + scrollY, w: box.width, h: box.height },
      chars,
      state: 0,
      lines: [],
      savedClip: "",
      savedTransition: "",
    };
    tasks.push(task);
    ids.push(task.id);
    return task;
  };

  const walk = (container: Element, parent: number) => {
    const boxes: Task[] = [];

    for (const child of Array.from(container.children)) {
      if (!(child instanceof HTMLElement || child instanceof SVGElement)) continue;
      const tag = child.tagName.toLowerCase();
      if (SKIP_TAGS.has(tag)) continue;

      // Visibility is not checked: the pre-paint gate hides <main> while scanning.
      const info = infos.get(child);
      if (!info || info.style.display === "none") continue;
      const { style, rect } = info;

      // Per-element override: "fade" | "media" reveal a live widget (3D ribbon, game) as
      // one block; "walk" builds the contents of a layer that would otherwise just fade.
      const as = child.getAttribute("data-swarm-as");
      if (as === "fade" || as === "media") {
        add(child, as, parent);
        continue;
      }
      if (as === "walk") {
        walk(child, parent);
        continue;
      }

      if (rect.width < 1 || rect.height < 1) {
        walk(child, parent);
        continue;
      }

      // Past the budget, whole subtrees simply fade in with their parent.
      if (ids.length >= TASK_BUDGET) {
        add(child, "fade", parent);
        continue;
      }

      // Decorative overlays (glows, gradients, watermark text) fade in quietly.
      if ((style.position === "absolute" || style.position === "fixed") && style.pointerEvents === "none") {
        add(child, "fade", parent);
        continue;
      }

      if (MEDIA_TAGS.has(tag) || (tag === "svg" && Math.max(rect.width, rect.height) >= 40)) {
        add(child, "media", parent);
        continue;
      }

      if (tag === "svg") {
        add(child, "fade", parent);
        continue;
      }

      if (FIELD_TAGS.has(tag)) {
        boxes.push(add(child, "box", parent));
        continue;
      }

      if (info.textLeaf) {
        add(child, "text", parent, child.textContent?.trim().length ?? 0);
        continue;
      }

      if (isPainted(style)) {
        if (rect.width <= 3 || rect.height <= 3) {
          add(child, "line", parent);
        } else if (rect.width * rect.height < 400) {
          add(child, "fade", parent);
        } else {
          const box = add(child, "box", parent);
          boxes.push(box);
          walk(child, box.id);
        }
        continue;
      }

      walk(child, parent);
    }

    // Repeated siblings (cards, pills, list rows): build the first, duplicate the rest.
    const groups = new Map<string, Task[]>();
    for (const box of boxes) {
      const key = `${box.el.tagName}|${box.el.getAttribute("class") ?? ""}`;
      const group = groups.get(key);
      if (group) group.push(box);
      else groups.set(key, [box]);
    }
    for (const group of Array.from(groups.values())) {
      for (let index = 1; index < group.length; index += 1) {
        group[index].kind = "dup";
        group[index].master = group[0].id;
      }
    }
  };

  walk(root, -1);
  return ids;
}

function findGuides(ids: number[], tasks: Task[]): number[] {
  const counts = new Map<number, number>();
  for (const id of ids) {
    const task = tasks[id];
    if (task.kind !== "text") continue;
    const x = Math.round(task.rect.x / 2) * 2;
    counts.set(x, (counts.get(x) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([x]) => x);
}

export function scanPage(): { tasks: Task[]; sections: Section[] } {
  const tasks: Task[] = [];
  const sections: Section[] = [];
  appendSections(Array.from(document.querySelectorAll<HTMLElement>("main section[id], body footer")), tasks, sections);
  return { tasks, sections };
}

/**
 * Scans more roots into an existing blueprint, one section each. Also used mid-build for
 * content that only settles later (the profile cards once they land off the ribbon).
 */
export function appendSections(roots: Element[], tasks: Task[], sections: Section[]): Task[] {
  const first = tasks.length;
  for (const root of roots) {
    const index = sections.length;
    const ids = scanSection(root, index, tasks);
    sections.push({
      index,
      label: SECTION_LABELS[root.id] ?? (root.tagName === "FOOTER" ? "Footer" : root.id || "Section"),
      tasks: ids,
      guides: findGuides(ids, tasks),
      started: false,
      startedAt: 0,
      speed: 1,
    });
  }
  return tasks.slice(first);
}
