import { writeFile, mkdir } from "node:fs/promises";
import { PNG } from "pngjs";
import { Resvg } from "@resvg/resvg-js";
import { laneAnnotations, renderSVG, clone, type Project } from "../src/model";
await mkdir("examples", { recursive: true });
await mkdir("docs", { recursive: true });
let seed = 537;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const png = new PNG({ width: 840, height: 450 });
for (let y = 0; y < 450; y++)
  for (let x = 0; x < 840; x++) {
    const i = (y * 840 + x) * 4,
      v = 12 + rand() * 9;
    png.data[i] = v * 0.8;
    png.data[i + 1] = v;
    png.data[i + 2] = v * 1.15;
    png.data[i + 3] = 255;
  }
const bands = [
  [58, 94, 132, 173, 216, 258, 299, 337, 373, 404],
  [133, 258],
  [134, 260],
  [134, 258],
  [134, 259],
  [259],
];
for (let lane = 0; lane < 6; lane++) {
  const cx = 70 + lane * 140;
  for (const y of bands[lane])
    for (let dy = -10; dy < 15; dy++)
      for (let dx = -34; dx < 34; dx++) {
        const i = ((y + dy) * 840 + cx + dx) * 4;
        const k =
          Math.exp(-Math.pow(dy - 2, 2) / 13) *
          Math.min(1, (34 - Math.abs(dx)) / 8) *
          (0.7 + rand() * 0.3);
        for (let c = 0; c < 3; c++)
          png.data[i + c] = Math.min(
            255,
            png.data[i + c] + [192, 211, 226][c] * k,
          );
      }
}
const bytes = PNG.sync.write(png);
await writeFile("examples/synthetic-gel.png", bytes);
const p: Project = {
  format: "gellabel",
  version: 1,
  image: {
    data: "data:image/png;base64," + bytes.toString("base64"),
    width: 840,
    height: 450,
    name: "synthetic-gel.png",
    synthetic: true,
  },
  annotations: laneAnnotations(6, 840, [
    "M",
    "Control",
    "Sample A",
    "Sample B",
    "Sample C",
    "NTC",
  ]),
  style: { fontSize: 18, color: "#263c35", background: "#ffffff" },
};
p.annotations.forEach((a, i) => { a.id = `example-lane-${i + 1}`; });
p.annotations.push(
  {
    id: "example-group",
    kind: "bracket",
    text: "Treatment",
    x: 350,
    y: -61,
    x2: 630,
    y2: -61,
  },
  {
    id: "example-band",
    kind: "band",
    text: "500 bp",
    x: -78,
    y: 179,
    x2: 0,
    y2: 0,
  },
);
await writeFile("examples/demo.gellabel.json", JSON.stringify(p, null, 2));
await writeFile(
  "examples/labels.tsv",
  "M\nControl\nSample A\nSample B\nSample C\nNTC\n",
);
await writeFile("examples/labeled.svg", renderSVG(p));
await writeFile(
  "docs/export-example.png",
  new Resvg(renderSVG(p), { font: { loadSystemFonts: true } }).render().asPng(),
);
const stages = [clone(p), clone(p), clone(p)];
stages[0].annotations = [];
stages[1].annotations = stages[1].annotations.filter((a) => a.kind === "lane");
for (let i = 0; i < stages.length; i++)
  await writeFile(
    `docs/step-${i + 1}.png`,
    new Resvg(renderSVG(stages[i]), { font: { loadSystemFonts: true } })
      .render()
      .asPng(),
  );
console.log(
  "Created synthetic gel, project, labels, SVG, and rendered export walkthrough.",
);
