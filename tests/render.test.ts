import test from "node:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { Resvg } from "@resvg/resvg-js";
import { renderSVG, validateProject, PAD, type Project } from "../src/model";
function project(): Project {
  const im = new PNG({ width: 2, height: 2 });
  im.data.set([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 0, 0, 0, 0]);
  return {
    format: "gellabel",
    version: 1,
    image: {
      data: "data:image/png;base64," + PNG.sync.write(im).toString("base64"),
      width: 2,
      height: 2,
      name: "transparent.png",
      synthetic: false,
    },
    annotations: [],
    style: { fontSize: 18, color: "#263c35", background: "#ffffff" },
  };
}
test("a real raster image survives project serialization byte for byte", () => {
  const p = project();
  assert.equal(
    validateProject(JSON.parse(JSON.stringify(p))).image.data,
    p.image.data,
  );
});
test("SVG rasterizes at the correct size and keeps image pixels in place", () => {
  const p = project(),
    output = PNG.sync.read(new Resvg(renderSVG(p)).render().asPng());
  assert.equal(output.width, 144);
  assert.equal(output.height, 144);
  const pixel = (x: number, y: number) =>
    Array.from(
      output.data.subarray(
        (y * output.width + x) * 4,
        (y * output.width + x) * 4 + 4,
      ),
    );
  assert.deepEqual(pixel(PAD.left, PAD.top), [255, 0, 0, 255]);
  assert.deepEqual(pixel(PAD.left + 1, PAD.top), [0, 255, 0, 255]);
  assert.deepEqual(pixel(PAD.left, PAD.top + 1), [0, 0, 255, 255]);
  assert.deepEqual(pixel(PAD.left + 1, PAD.top + 1), [255, 255, 255, 255]);
});
test("large images pass only within documented bounds", () => {
  const p = project();
  p.image.width = 6000;
  p.image.height = 4000;
  assert.doesNotThrow(() => validateProject(p));
  p.image.height = 4001;
  assert.throws(() => validateProject(p));
});
test("Unicode and literal markup render as text without external resources", () => {
  const p = project();
  p.annotations = [
    {
      id: "test",
      kind: "text",
      text: '对照 <img src=x> & "test"\u0000',
      x: 0,
      y: -20,
      x2: 0,
      y2: 0,
    },
  ];
  const svg = renderSVG(p);
  assert.ok(svg.includes("&lt;img src=x&gt;"));
  assert.ok(!svg.includes("\u0000"));
  assert.doesNotThrow(() => new Resvg(svg).render());
});
