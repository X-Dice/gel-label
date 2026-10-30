import test from "node:test";
import assert from "node:assert/strict";
import {
  History,
  laneAnnotations,
  parseLabels,
  moveAnnotation,
  validateProject,
  renderSVG,
  type Project,
} from "../src/model";
const fixture = (): Project => ({
  format: "gellabel",
  version: 1,
  image: {
    data: "data:image/png;base64,aGVsbG8=",
    width: 840,
    height: 450,
    name: "example.png",
    synthetic: false,
  },
  annotations: laneAnnotations(6, 840),
  style: { fontSize: 18, color: "#263c35", background: "#ffffff" },
});
test("lanes are centered in their cells; count is bounded", () => {
  assert.deepEqual(
    laneAnnotations(3, 600).map((a) => a.x),
    [100, 300, 500],
  );
  assert.equal(laneAnnotations(100, 600).length, 40);
  assert.equal(laneAnnotations(0, 600).length, 1);
});
test("Excel labels preserve Unicode, trim CRLF and take only first column", () => {
  assert.deepEqual(parseLabels("M\r\n对照组\tother\r\n A & <B> \n\n"), [
    "M",
    "对照组",
    "A & <B>",
  ]);
  assert.equal(parseLabels("x\n".repeat(50)).length, 40);
});
test("moving a lane only moves x and clamps it within the image", () => {
  const a = fixture().annotations[0];
  assert.equal(moveAnnotation(a, -1000, 40, 840, 450).x, 0);
  assert.equal(moveAnnotation(a, 0, 40, 840, 450).y, a.y);
});
test("arrow translations preserve the vector even at boundaries", () => {
  const a = {
    id: "a",
    kind: "arrow" as const,
    text: "x",
    x: 780,
    y: 400,
    x2: 830,
    y2: 440,
  };
  const b = moveAnnotation(a, 300, 300, 840, 450);
  assert.equal(b.x2 - b.x, 50);
  assert.equal(b.y2 - b.y, 40);
  assert.ok(b.x2 <= 880);
  assert.ok(b.y2 <= 482);
});
test("undo, redo, and divergent edits are independent snapshots", () => {
  const p = fixture(),
    h = new History(p);
  p.annotations[0].text = "edited";
  h.commit(p);
  assert.equal(h.undo().annotations[0].text, "M");
  const redo = h.redo();
  assert.equal(redo.annotations[0].text, "edited");
  redo.annotations[0].text = "outside mutation";
  assert.equal(h.undo().annotations[0].text, "M");
  h.commit({ ...p, annotations: [] });
  assert.equal(h.canRedo, false);
});
test("valid project survives JSON roundtrip without unknown fields", () => {
  const p = fixture();
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), p);
  assert.equal(
    "unknown" in validateProject({ ...p, unknown: "ignored" }),
    false,
  );
});
test("rejects unsupported versions, network images, oversized and invalid projects", () => {
  for (const mutate of [
    (p: Project) => (p.version = 2 as 1),
    (p: Project) => (p.image.data = "https://example.com/x.png"),
    (p: Project) => (p.image.data = "data:image/svg+xml;base64,PHN2Zz4="),
    (p: Project) => (p.image.width = 25000),
    (p: Project) => (p.annotations[0].x = NaN),
    (p: Project) => (p.style.color = 'red" onload="evil'),
    (p: Project) => p.annotations.push(p.annotations[0]),
    (p: Project) => (p.annotations[0].text = "a".repeat(201)),
  ]) {
    const p = fixture();
    mutate(p);
    assert.throws(() => validateProject(p));
  }
  assert.throws(() => validateProject(null));
  assert.throws(() => validateProject({}));
});
test("exports escape annotation text and embed the image; no guides or selection", () => {
  const p = fixture();
  p.annotations[0].text = '对照 & <script>alert("x")</script>';
  const svg = renderSVG(p);
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes("对照 &amp;"));
  assert.ok(svg.includes(p.image.data));
  assert.ok(!svg.includes("stroke-dasharray"));
  assert.ok(!svg.includes("http://example"));
  assert.ok(!svg.includes("<script>"));
});
test("synthetic demo watermark remains in exported figures", () => {
  const p = fixture();
  p.image.synthetic = true;
  assert.match(renderSVG(p), /SYNTHETIC DEMO/);
});
