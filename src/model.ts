export type Kind = "lane" | "text" | "arrow" | "bracket" | "band";
export type Annotation = {
  id: string;
  kind: Kind;
  text: string;
  x: number;
  y: number;
  x2: number;
  y2: number;
};
export type Project = {
  format: "gellabel";
  version: 1;
  image: {
    data: string;
    width: number;
    height: number;
    name: string;
    synthetic: boolean;
  };
  annotations: Annotation[];
  style: { fontSize: number; color: string; background: string };
};
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PIXELS = 24_000_000;
export const clone = <T>(value: T): T => structuredClone(value);
export const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));
export function laneAnnotations(
  count: number,
  width: number,
  labels: string[] = [],
): Annotation[] {
  const n = clamp(Math.round(count), 1, 40);
  return Array.from({ length: n }, (_, i) => ({
    id: uid(),
    kind: "lane",
    text: labels[i]?.slice(0, 200) || (i === 0 ? "M" : `Lane ${i}`),
    x: (width * (i + 0.5)) / n,
    y: -26,
    x2: 0,
    y2: 0,
  }));
}
export function parseLabels(input: string): string[] {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((s) => s.split("\t")[0].trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((s) => s.slice(0, 200));
}
export function moveAnnotation(
  a: Annotation,
  dx: number,
  dy: number,
  width: number,
  height: number,
): Annotation {
  if (a.kind === "lane") return { ...a, x: clamp(a.x + dx, 0, width) };
  // Translate both endpoints by the same amount, including near the figure edges.
  const hasEnd = a.kind === "arrow" || a.kind === "bracket";
  const tx = clamp(
    dx,
    -82 - Math.min(a.x, hasEnd ? a.x2 : a.x),
    width + 40 - Math.max(a.x, hasEnd ? a.x2 : a.x),
  );
  const ty = clamp(
    dy,
    -82 - Math.min(a.y, hasEnd ? a.y2 : a.y),
    height + 32 - Math.max(a.y, hasEnd ? a.y2 : a.y),
  );
  return {
    ...a,
    x: a.x + tx,
    y: a.y + ty,
    x2: hasEnd ? a.x2 + tx : a.x2,
    y2: hasEnd ? a.y2 + ty : a.y2,
  };
}
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  private present: T;
  constructor(initial: T) {
    this.present = clone(initial);
  }
  get canUndo(): boolean {
    return this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.future.length > 0;
  }
  commit(next: T): void {
    if (JSON.stringify(next) === JSON.stringify(this.present)) return;
    this.past.push(this.present);
    if (this.past.length > 50) this.past.shift();
    this.present = clone(next);
    this.future = [];
  }
  undo(): T {
    if (this.canUndo) {
      this.future.push(this.present);
      this.present = this.past.pop()!;
    }
    return clone(this.present);
  }
  redo(): T {
    if (this.canRedo) {
      this.past.push(this.present);
      this.present = this.future.pop()!;
    }
    return clone(this.present);
  }
}
export function validateProject(value: unknown): Project {
  const p = value as Project;
  const fail = (): never => {
    throw new Error("Invalid GelLabel project / 无效的 GelLabel 项目");
  };
  if (
    !p ||
    p.format !== "gellabel" ||
    p.version !== 1 ||
    !p.image ||
    !p.style ||
    !Array.isArray(p.annotations)
  )
    fail();
  const im = p.image;
  if (
    typeof im.data !== "string" ||
    im.data.length > 29_000_000 ||
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(im.data)
  )
    fail();
  if (
    ![im.width, im.height].every(
      (n) => Number.isInteger(n) && n > 0 && n <= 16000,
    ) ||
    im.width * im.height > MAX_PIXELS
  )
    fail();
  if (
    typeof im.name !== "string" ||
    im.name.length > 250 ||
    typeof im.synthetic !== "boolean"
  )
    fail();
  if (
    !Number.isFinite(p.style.fontSize) ||
    p.style.fontSize < 10 ||
    p.style.fontSize > 48 ||
    !/^#[0-9a-f]{6}$/i.test(p.style.color) ||
    !/^#[0-9a-f]{6}$/i.test(p.style.background)
  )
    fail();
  if (p.annotations.length > 400) fail();
  const ids = new Set<string>();
  const annotations = p.annotations.map((a) => {
    if (
      !a ||
      typeof a.id !== "string" ||
      !a.id ||
      a.id.length > 100 ||
      ids.has(a.id) ||
      !["lane", "text", "arrow", "bracket", "band"].includes(a.kind) ||
      typeof a.text !== "string" ||
      a.text.length > 200
    )
      fail();
    ids.add(a.id);
    if (
      ![a.x, a.y, a.x2, a.y2].every(Number.isFinite) ||
      a.x < -82 ||
      a.x > im.width + 40 ||
      a.y < -82 ||
      a.y > im.height + 32 ||
      a.x2 < -82 ||
      a.x2 > im.width + 40 ||
      a.y2 < -82 ||
      a.y2 > im.height + 32
    )
      fail();
    return {
      id: a.id,
      kind: a.kind,
      text: a.text,
      x: a.x,
      y: a.y,
      x2: a.x2,
      y2: a.y2,
    };
  });
  // Whitelist fields; never preserve arbitrary imported object properties.
  return {
    format: "gellabel",
    version: 1,
    image: {
      data: im.data,
      width: im.width,
      height: im.height,
      name: im.name,
      synthetic: im.synthetic,
    },
    annotations,
    style: {
      fontSize: p.style.fontSize,
      color: p.style.color,
      background: p.style.background,
    },
  };
}
export const escapeXML = (s: string): string =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "�")
    .replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c]!,
    );
export const PAD = { left: 92, top: 98, right: 50, bottom: 44 };
export function renderSVG(p: Project, selected = "", guides = false): string {
  const { width: w, height: h, data } = p.image;
  const color = p.style.color,
    fs = p.style.fontSize;
  const text = (
    x: number,
    y: number,
    s: string,
    anchor = "middle",
    fill = color,
  ) =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="${fs}" font-family="Arial, Helvetica, sans-serif">${escapeXML(s)}</text>`;
  const marks = p.annotations
    .map((a) => {
      let content = "";
      if (a.kind === "lane") content = text(a.x, a.y, a.text);
      if (a.kind === "text" || a.kind === "band")
        content = text(a.x, a.y, a.text, "start");
      if (a.kind === "arrow")
        content =
          `<line x1="${a.x}" y1="${a.y}" x2="${a.x2}" y2="${a.y2}" stroke="${color}" stroke-width="2" marker-end="url(#arrowhead)"/>` +
          text(a.x, a.y - 10, a.text);
      if (a.kind === "bracket")
        content =
          `<path d="M ${a.x} ${a.y + 8} V ${a.y} H ${a.x2} V ${a.y + 8}" fill="none" stroke="${color}" stroke-width="1.8"/>` +
          text((a.x + a.x2) / 2, a.y - 10, a.text);
      const line =
        guides && a.kind === "lane"
          ? `<path d="M ${a.x} 0 V ${h}" stroke="#4bb59a" stroke-opacity=".35" stroke-dasharray="4 6" pointer-events="none"/>`
          : "";
      const indicator =
        selected === a.id
          ? `<circle cx="${a.x}" cy="${a.y - 6}" r="${fs * 0.9}" fill="#43ad91" fill-opacity=".13" stroke="#258269" stroke-dasharray="3 3" pointer-events="none"/>`
          : "";
      return `${line}<g data-id="${escapeXML(a.id)}" class="annotation" tabindex="0" role="button" aria-label="${escapeXML(a.kind + ": " + a.text)}" style="cursor:move">${indicator}${content}<circle cx="${a.x}" cy="${a.y - 6}" r="${Math.max(12, fs * 0.8)}" fill="transparent"/></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w + PAD.left + PAD.right} ${h + PAD.top + PAD.bottom}" width="${w + PAD.left + PAD.right}" height="${h + PAD.top + PAD.bottom}" role="img" aria-label="Annotated gel figure"><defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" fill="${color}"/></marker></defs><rect width="100%" height="100%" fill="${p.style.background}"/><g transform="translate(${PAD.left} ${PAD.top})"><image width="${w}" height="${h}" xlink:href="${data}"/>${marks}</g>${p.image.synthetic ? `<text x="${PAD.left}" y="${h + PAD.top + 28}" font-family="Arial, sans-serif" font-size="12" fill="${color}">SYNTHETIC DEMO · NOT EXPERIMENTAL DATA</text>` : ""}</svg>`;
}
