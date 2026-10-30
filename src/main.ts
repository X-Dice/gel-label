import "./style.css";
import {
  type Project,
  type Annotation,
  type Kind,
  History,
  uid,
  clone,
  clamp,
  laneAnnotations,
  parseLabels,
  validateProject,
  renderSVG,
  PAD,
  MAX_FILE_BYTES,
  MAX_PIXELS,
  moveAnnotation,
} from "./model";
const en = {
  tag: "FROM GEL TO FIGURE",
  subtitle: "Clear labels. Original pixels.",
  local: "Files stay in your browser",
  open: "Open image",
  sample: "Try sample",
  project: "Open project",
  save: "Save project",
  export: "Export figure",
  lanes: "LANES",
  count: "Number of lanes",
  arrange: "Arrange lanes",
  paste: "Paste lane labels",
  hint: "One label per line. Paste a column from Excel.",
  apply: "Apply labels",
  tools: "ANNOTATE",
  select: "Select",
  text: "Text",
  arrow: "Arrow",
  bracket: "Group",
  band: "Band size",
  style: "FIGURE STYLE",
  font: "Text size",
  ink: "Label color",
  paper: "Paper color",
  guides: "Lane guides",
  guidesHint: "Guides and selection are excluded from exports.",
  inspector: "SELECTION",
  empty: "Select a label to edit it. Drag it on the figure to move it.",
  label: "Label",
  remove: "Delete annotation",
  undo: "Undo",
  redo: "Redo",
  canvas: "FIGURE WORKSPACE",
  original: "Original image preserved",
  synthetic: "Synthetic sample",
  shortcut: "Drag to move · Arrow keys to nudge · ⌘/Ctrl Z to undo",
  click: "Click the figure to place your annotation",
  privacy: "No uploads. No account. No tracking.",
  about: "Made for the moments between the bench and the report.",
  offline: "Download offline app",
  narrow:
    "Best on a desktop or tablet. Scroll sideways for the full workspace.",
  replace: "Replace this session? Save a project first to keep your work.",
  badImage: "Use PNG, JPEG or WebP, up to 20 MB and 24 megapixels.",
  tooMany: "Maximum 400 annotations per figure.",
  exported: "Downloaded",
  loaded: "Image loaded",
  restored: "Project restored",
  meta: "PNG / JPEG / WebP · up to 20 MB",
  help: "Label your lanes, mark your bands, and make your next figure.",
  exportHint: "PNG up to 2× · editable SVG · project JSON",
  position: "POSITION",
  end: "ENDPOINT",
  failed: "Could not read this image or project.",
  newText: "Label",
  newGroup: "Group",
};
const zh: typeof en = {
  tag: "从胶图，到清晰的实验配图",
  subtitle: "标注清楚，原图保留。",
  local: "文件只在浏览器内处理",
  open: "打开图片",
  sample: "试用示例",
  project: "打开项目",
  save: "保存项目",
  export: "导出图片",
  lanes: "泳道",
  count: "泳道数量",
  arrange: "排列泳道",
  paste: "粘贴泳道名称",
  hint: "每行一个名称，可直接粘贴 Excel 中的一列。",
  apply: "应用标签",
  tools: "添加标注",
  select: "选择",
  text: "文字",
  arrow: "箭头",
  bracket: "分组",
  band: "条带大小",
  style: "配图样式",
  font: "字号",
  ink: "标注颜色",
  paper: "背景颜色",
  guides: "泳道辅助线",
  guidesHint: "导出时不包含辅助线和选中标记。",
  inspector: "当前标注",
  empty: "选中标注进行编辑，拖动即可调整位置。",
  label: "标注内容",
  remove: "删除标注",
  undo: "撤销",
  redo: "重做",
  canvas: "配图工作区",
  original: "原始图片保持不变",
  synthetic: "模拟示例",
  shortcut: "拖动调整位置 · 方向键微调 · ⌘/Ctrl Z 撤销",
  click: "点击配图，放置标注",
  privacy: "不上传文件，无需账号，无追踪。",
  about: "从实验台到实验报告，少一点排版工作。",
  offline: "下载离线版",
  narrow: "建议使用电脑或平板；可横向滚动查看完整工作区。",
  replace: "替换当前会话？请先保存项目以保留修改。",
  badImage: "请选择 PNG、JPEG 或 WebP，不超过 20 MB、2400 万像素。",
  tooMany: "每张图最多添加 400 个标注。",
  exported: "已下载",
  loaded: "图片已载入",
  restored: "项目已恢复",
  meta: "PNG / JPEG / WebP · 不超过 20 MB",
  help: "添加泳道名称、标出条带，让下一张实验配图更清楚。",
  exportHint: "最高 2 倍 PNG · 可编辑 SVG · 项目 JSON",
  position: "位置",
  end: "终点",
  failed: "无法读取这张图片或项目文件。",
  newText: "文字标注",
  newGroup: "实验组",
};
let lang: "en" | "zh" = navigator.language.startsWith("zh") ? "zh" : "en";
const t = (key: keyof typeof en) => (lang === "en" ? en : zh)[key];
let tool: Kind | "select" = "select",
  selected = "",
  guides = true,
  dirty = false;
let project: Project, history: History<Project>, noticeTimer: number;
let drag: {
  id: string;
  start: { x: number; y: number };
  original: Annotation;
  moved: boolean;
} | null = null;
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const icons = { select: "↖", text: "T", arrow: "↗", bracket: "⊓", band: "≡" };
function sample(): Project {
  const c = document.createElement("canvas");
  c.width = 840;
  c.height = 450;
  const ctx = c.getContext("2d")!;
  let seed = 537;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const p = ctx.createImageData(840, 450);
  for (let i = 0; i < p.data.length; i += 4) {
    const v = 12 + rand() * 9;
    p.data[i] = v * 0.8;
    p.data[i + 1] = v;
    p.data[i + 2] = v * 1.15;
    p.data[i + 3] = 255;
  }
  ctx.putImageData(p, 0, 0);
  const bands = [
    [58, 94, 132, 173, 216, 258, 299, 337, 373, 404],
    [133, 258],
    [134, 260],
    [134, 258],
    [134, 259],
    [259],
  ];
  for (let l = 0; l < 6; l++) {
    const x = 70 + l * 140;
    ctx.fillStyle = "#090e12";
    ctx.fillRect(x - 28, 17, 56, 12);
    for (const y of bands[l]) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#afd9ff";
      ctx.fillStyle =
        l === 0
          ? "rgba(208,228,242,.8)"
          : `rgba(204,231,246,${0.65 + rand() * 0.3})`;
      ctx.fillRect(x - 26 + rand() * 4, y, 49 + rand() * 5, 3 + rand() * 3);
      ctx.shadowBlur = 0;
    }
  }
  const a = laneAnnotations(6, 840, [
    "M",
    "Control",
    "Sample A",
    "Sample B",
    "Sample C",
    "NTC",
  ]);
  a.push(
    {
      id: uid(),
      kind: "bracket",
      text: "Treatment",
      x: 350,
      y: -61,
      x2: 630,
      y2: -61,
    },
    { id: uid(), kind: "band", text: "500 bp", x: -78, y: 179, x2: 0, y2: 0 },
  );
  return {
    format: "gellabel",
    version: 1,
    image: {
      data: c.toDataURL("image/png"),
      width: 840,
      height: 450,
      name: "synthetic-gel.png",
      synthetic: true,
    },
    annotations: a,
    style: { fontSize: 18, color: "#263c35", background: "#ffffff" },
  };
}
function toast(msg: string, error = false) {
  const n = $("notice");
  n.textContent = msg;
  n.className = `notice visible ${error ? "error" : ""}`;
  clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => (n.className = "notice"), 5000);
}
function commit() {
  history.commit(project);
  dirty = true;
  render();
}
function renderFigure() {
  $("figure").innerHTML = renderSVG(project, selected, guides);
}
function render() {
  const active = document.activeElement as HTMLElement | null;
  const focusedAnnotation =
    active?.closest<SVGGElement>("[data-id]")?.dataset.id;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  $("app").innerHTML =
    `<header class="topbar"><a class="brand" href="#"><span class="brand-icon">▤</span>Gel<span>Label</span><sup>0.1</sup></a><div class="top-actions"><span class="local"><i></i>${t("local")}</span><button id="language" class="quiet" aria-label="Change language">${lang === "en" ? "中文" : "EN"}</button><a class="github" href="https://github.com/X-Dice/gel-label" target="_blank" rel="noopener">GitHub ↗</a></div></header>
 <main><section class="intro"><div><p class="eyebrow">${t("tag")}</p><h1>${t("subtitle")}</h1><p class="intro-help">${t("help")}</p></div><div class="file-actions"><button id="sample" class="quiet">${t("sample")}</button><button id="open-project" class="secondary">${t("project")}</button><button id="open-image" class="primary">＋ ${t("open")}</button></div></section><p class="narrow">${t("narrow")}</p>
 <div class="workbench"><aside class="sidebar"><section><h2><span>01</span> ${t("lanes")}</h2><label for="lane-count">${t("count")}</label><div class="inline"><input id="lane-count" type="number" min="1" max="40" value="${project.annotations.filter((a) => a.kind === "lane").length || 6}"><button id="arrange" class="secondary">${t("arrange")}</button></div><label for="labels">${t("paste")}</label><textarea id="labels" rows="5" placeholder="M&#10;Control&#10;Sample A" spellcheck="false">${esc(
   project.annotations
     .filter((a) => a.kind === "lane")
     .map((a) => a.text)
     .join("\n"),
 )}</textarea><p class="hint">${t("hint")}</p><button id="apply-labels" class="wide secondary">${t("apply")} <span>↵</span></button></section>
 <section><h2><span>02</span> ${t("tools")}</h2><div class="tools">${(["select", "text", "arrow", "bracket", "band"] as const).map((k) => `<button class="tool ${tool === k ? "active" : ""}" data-tool="${k}" aria-pressed="${tool === k}" title="${t(k)}"><b>${icons[k]}</b>${t(k)}</button>`).join("")}</div></section>
 <section><h2><span>03</span> ${t("style")}</h2><div class="style-row"><label for="font-size">${t("font")}</label><input id="font-size" type="number" min="10" max="48" value="${project.style.fontSize}"></div><div class="style-row"><label for="ink">${t("ink")}</label><input id="ink" type="color" value="${project.style.color}"></div><div class="style-row"><label for="paper">${t("paper")}</label><input id="paper" type="color" value="${project.style.background}"></div><label class="checkbox"><input id="guides" type="checkbox" ${guides ? "checked" : ""}>${t("guides")}</label><p class="hint">${t("guidesHint")}</p></section></aside>
 <section class="workspace"><div class="canvas-bar"><span>${t("canvas")}</span><div><button id="undo" class="icon-button" ${history.canUndo ? "" : "disabled"} aria-label="${t("undo")}" title="${t("undo")} (⌘/Ctrl Z)">↶</button><button id="redo" class="icon-button" ${history.canRedo ? "" : "disabled"} aria-label="${t("redo")}" title="${t("redo")} (⌘/Ctrl Shift Z)">↷</button></div></div><div id="stage" class="stage ${tool !== "select" ? "placing" : ""}" aria-label="Figure editor"><div id="figure"></div></div><div class="canvas-footer"><span class="sample-badge">${project.image.synthetic ? t("synthetic") : t("original")}</span><span>${project.image.width} × ${project.image.height} px</span></div><div class="workspace-bottom"><p>${tool === "select" ? t("shortcut") : t("click")}</p><span>SVG + PNG</span></div></section>
 <aside class="inspector"><h2>${t("inspector")}</h2><div id="selection"></div><div class="image-info"><span class="mini-gel">▤</span><strong>${esc(project.image.name)}</strong><p>${t("original")}</p><p>${t("meta")}</p></div><div class="export-panel"><p class="eyebrow">${t("export")}</p><button id="export-png" class="primary wide">PNG <span>↓</span></button><button id="export-svg" class="secondary wide">SVG <span>↓</span></button><button id="save-project" class="quiet wide">${t("save")} ↓</button><p class="hint">${t("exportHint")}</p></div></aside></div>
 <footer><div><strong>GelLabel</strong><span>${t("about")}</span></div><div><span>${t("privacy")}</span><a href="./GelLabel-offline.html" download>${t("offline")} ↓</a></div></footer></main><div id="notice" class="notice" role="status" aria-live="polite"></div><input id="image-input" type="file" accept="image/png,image/jpeg,image/webp" hidden><input id="project-input" type="file" accept=".json,application/json" hidden>`;
  renderFigure();
  renderSelection();
  bind();
  if (focusedAnnotation)
    document
      .querySelector<SVGGElement>(
        `[data-id="${CSS.escape(focusedAnnotation)}"]`,
      )
      ?.focus();
}
function renderSelection() {
  const a = project.annotations.find((a) => a.id === selected);
  $("selection").innerHTML = a
    ? `<span class="kind-tag">${t(a.kind === "lane" ? "lanes" : a.kind)}</span><label for="annotation-label">${t("label")}</label><input id="annotation-label" type="text" maxlength="200" value="${esc(a.text)}"><p class="eyebrow position-title">${t("position")}</p><div class="coordinates"><label>X<input id="annotation-x" type="number" value="${Math.round(a.x)}"></label><label>Y<input id="annotation-y" type="number" value="${Math.round(a.y)}" ${a.kind === "lane" ? "disabled" : ""}></label></div>${a.kind === "arrow" || a.kind === "bracket" ? `<p class="eyebrow position-title">${t("end")}</p><div class="coordinates"><label>X<input id="annotation-x2" type="number" value="${Math.round(a.x2)}"></label>${a.kind === "arrow" ? `<label>Y<input id="annotation-y2" type="number" value="${Math.round(a.y2)}"></label>` : ""}</div>` : ""}<button id="delete" class="danger wide">${t("remove")}</button>`
    : `<div class="selection-empty"><span>↖</span><p>${t("empty")}</p></div>`;
}
function select(id: string) {
  selected = id;
  renderFigure();
  renderSelection();
  bindSelection();
}
function bindSelection() {
  const a = project.annotations.find((a) => a.id === selected);
  if (!a) return;
  $("annotation-label").onchange = (e) => {
    a.text = (e.target as HTMLInputElement).value.slice(0, 200);
    commit();
  };
  for (const key of ["x", "y", "x2", "y2"] as const) {
    const field = document.getElementById(`annotation-${key}`);
    if (!field) continue;
    field.onchange = (e) => {
      const n = Number((e.target as HTMLInputElement).value);
      if (!Number.isFinite(n)) return;
      a[key] = clamp(
        n,
        -82,
        key.startsWith("x")
          ? project.image.width + 40
          : project.image.height + 32,
      );
      if (a.kind === "lane") a.x = clamp(a.x, 0, project.image.width);
      if (a.kind === "bracket") a.y2 = a.y;
      commit();
    };
  }
  $("delete").onclick = removeSelected;
}
function removeSelected() {
  if (!selected) return;
  project.annotations = project.annotations.filter((a) => a.id !== selected);
  selected = "";
  commit();
}
function undo() {
  project = history.undo();
  selected = "";
  dirty = true;
  render();
}
function redo() {
  project = history.redo();
  selected = "";
  dirty = true;
  render();
}
function replaceLanes(count: number, labels: string[]) {
  const rest = project.annotations.filter((a) => a.kind !== "lane");
  const lanes = laneAnnotations(count, project.image.width, labels);
  if (rest.length + lanes.length > 400) {
    toast(t("tooMany"), true);
    return;
  }
  project.annotations = rest.concat(lanes);
  selected = "";
  commit();
}
function bind() {
  $("figure").addEventListener("focusin", (e) => {
    const mark = (e.target as Element).closest<SVGGElement>("[data-id]");
    if (mark) {
      selected = mark.dataset.id!;
      renderSelection();
      bindSelection();
    }
  });
  $("language").onclick = () => {
    lang = lang === "en" ? "zh" : "en";
    render();
  };
  $("sample").onclick = () => {
    if (dirty && !confirm(t("replace"))) return;
    project = sample();
    history = new History(project);
    selected = "";
    dirty = false;
    render();
  };
  $("open-image").onclick = () => $("image-input").click();
  $("open-project").onclick = () => $("project-input").click();
  $("image-input").onchange = (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) void loadFile(f, false);
  };
  $("project-input").onchange = (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) void loadFile(f, true);
  };
  $("arrange").onclick = () => {
    const n = Number(($("lane-count") as HTMLInputElement).value);
    if (!Number.isFinite(n)) return;
    replaceLanes(n, parseLabels(($("labels") as HTMLTextAreaElement).value));
  };
  $("apply-labels").onclick = () => {
    const labels = parseLabels(($("labels") as HTMLTextAreaElement).value);
    if (!labels.length) return;
    const lanes = project.annotations.filter((a) => a.kind === "lane");
    if (labels.length === lanes.length)
      lanes.forEach((a, i) => (a.text = labels[i]));
    else {
      replaceLanes(labels.length, labels);
      return;
    }
    commit();
  };
  document.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach(
    (b) =>
      (b.onclick = () => {
        tool = b.dataset.tool as typeof tool;
        render();
      }),
  );
  $("font-size").onchange = (e) => {
    project.style.fontSize = clamp(
      Number((e.target as HTMLInputElement).value) || 18,
      10,
      48,
    );
    commit();
  };
  $("ink").onchange = (e) => {
    project.style.color = (e.target as HTMLInputElement).value;
    commit();
  };
  $("paper").onchange = (e) => {
    project.style.background = (e.target as HTMLInputElement).value;
    commit();
  };
  $("guides").onchange = (e) => {
    guides = (e.target as HTMLInputElement).checked;
    renderFigure();
  };
  $("undo").onclick = undo;
  $("redo").onclick = redo;
  $("export-svg").onclick = () =>
    download(new Blob([renderSVG(project)], { type: "image/svg+xml" }), "svg");
  $("export-png").onclick = () => void exportPNG();
  $("save-project").onclick = () => {
    download(
      new Blob([JSON.stringify(project, null, 2)], {
        type: "application/json",
      }),
      "gellabel.json",
    );
    dirty = false;
  };
  $("stage").onpointerdown = pointerDown;
  $("stage").ondragover = (e) => {
    e.preventDefault();
    $("stage").classList.add("drag-over");
  };
  $("stage").ondragleave = () => $("stage").classList.remove("drag-over");
  $("stage").ondrop = (e) => {
    e.preventDefault();
    $("stage").classList.remove("drag-over");
    const f = e.dataTransfer?.files[0];
    if (f) void loadFile(f, f.name.toLowerCase().endsWith(".json"));
  };
  bindSelection();
}
function point(e: PointerEvent) {
  const r = document.querySelector("#figure svg")!.getBoundingClientRect();
  return {
    x:
      ((e.clientX - r.left) / r.width) *
        (project.image.width + PAD.left + PAD.right) -
      PAD.left,
    y:
      ((e.clientY - r.top) / r.height) *
        (project.image.height + PAD.top + PAD.bottom) -
      PAD.top,
  };
}
function pointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  const mark = (e.target as Element).closest<SVGGElement>("[data-id]");
  if (tool === "select") {
    if (!mark) {
      select("");
      return;
    }
    e.preventDefault();
    select(mark.dataset.id!);
    drag = {
      id: selected,
      start: point(e),
      original: clone(project.annotations.find((a) => a.id === selected)!),
      moved: false,
    };
    return;
  }
  if (project.annotations.length >= 400) {
    toast(t("tooMany"), true);
    return;
  }
  const p = point(e),
    x = clamp(p.x, -70, project.image.width - 80),
    y = clamp(p.y, -65, project.image.height + 20);
  const a: Annotation = {
    id: uid(),
    kind: tool,
    text:
      tool === "bracket"
        ? t("newGroup")
        : tool === "band"
          ? "500 bp"
          : tool === "text"
            ? t("newText")
            : "",
    x,
    y,
    x2: Math.min(x + (tool === "bracket" ? 120 : 70), project.image.width + 40),
    y2: tool === "bracket" ? y : Math.min(y + 45, project.image.height + 32),
  };
  project.annotations.push(a);
  selected = a.id;
  tool = "select";
  commit();
  $("annotation-label").focus();
}
window.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const p = point(e),
    dx = p.x - drag.start.x,
    dy = p.y - drag.start.y;
  if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
  const moved = moveAnnotation(
    drag.original,
    dx,
    dy,
    project.image.width,
    project.image.height,
  );
  project.annotations = project.annotations.map((a) =>
    a.id === drag!.id ? moved : a,
  );
  renderFigure();
});
function finishDrag(cancel = false) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (cancel) {
    project.annotations = project.annotations.map((a) =>
      a.id === d.id ? d.original : a,
    );
    render();
  } else if (d.moved) commit();
}
window.addEventListener("blur", () => finishDrag());
window.addEventListener("pointerup", () => finishDrag());
window.addEventListener("pointercancel", () => finishDrag(true));
window.addEventListener("keydown", (e) => {
  const el = e.target as HTMLElement;
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
    el.isContentEditable
  )
    return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redo();
    return;
  }
  if (e.key === "Escape") {
    finishDrag(true);
    selected = "";
    tool = "select";
    render();
    return;
  }
  if ((e.key === "Delete" || e.key === "Backspace") && selected) {
    e.preventDefault();
    removeSelected();
    return;
  }
  const a = project.annotations.find((a) => a.id === selected);
  if (!a) return;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    const n = e.shiftKey ? 10 : 1;
    const dx = e.key === "ArrowLeft" ? -n : e.key === "ArrowRight" ? n : 0,
      dy = e.key === "ArrowUp" ? -n : e.key === "ArrowDown" ? n : 0;
    project.annotations = project.annotations.map((item) =>
      item.id === a.id
        ? moveAnnotation(a, dx, dy, project.image.width, project.image.height)
        : item,
    );
    commit();
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function imageFrom(data: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(t("failed")));
    im.src = data;
  });
}
function readData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error(t("failed")));
    r.readAsDataURL(file);
  });
}
async function loadFile(file: File, isProject: boolean) {
  try {
    if (file.size > (isProject ? 30 * 1024 * 1024 : MAX_FILE_BYTES))
      throw new Error(t("badImage"));
    let next: Project;
    if (isProject) {
      next = validateProject(JSON.parse(await file.text()));
      const image = await imageFrom(next.image.data);
      if (
        image.naturalWidth !== next.image.width ||
        image.naturalHeight !== next.image.height
      )
        throw new Error(t("failed"));
    } else {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
        throw new Error(t("badImage"));
      const data = await readData(file),
        im = await imageFrom(data),
        w = im.naturalWidth,
        h = im.naturalHeight;
      if (!w || !h || w > 16000 || h > 16000 || w * h > MAX_PIXELS)
        throw new Error(t("badImage"));
      // Embed the original file bytes; the image layer is never edited or resampled.
      next = {
        format: "gellabel",
        version: 1,
        image: {
          data,
          width: w,
          height: h,
          name: file.name.slice(0, 250),
          synthetic: false,
        },
        annotations: laneAnnotations(6, w),
        style: clone(project.style),
      };
    }
    if (dirty && !confirm(t("replace"))) return;
    project = next;
    history = new History(project);
    selected = "";
    tool = "select";
    dirty = false;
    render();
    toast(t(isProject ? "restored" : "loaded"));
  } catch (e) {
    toast(e instanceof Error ? e.message : t("failed"), true);
  }
}
function download(blob: Blob, ext: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `${project.image.name.replace(/\.[^.]+$/, "")}-labeled.${ext}`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  toast(`${t("exported")} · ${ext.toUpperCase()}`);
}
async function exportPNG() {
  try {
    const url = URL.createObjectURL(
      new Blob([renderSVG(project)], { type: "image/svg+xml" }),
    );
    try {
      const im = await imageFrom(url),
        c = document.createElement("canvas"),
        w = project.image.width + PAD.left + PAD.right,
        h = project.image.height + PAD.top + PAD.bottom,
        scale = Math.min(
          2,
          Math.sqrt(48_000_000 / (w * h)),
          16000 / Math.max(w, h),
        );
      c.width = Math.round(w * scale);
      c.height = Math.round(h * scale);
      c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        c.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error(t("failed"));
      download(blob, "png");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    toast(e instanceof Error ? e.message : t("failed"), true);
  }
}
project = sample();
history = new History(project);
render();
