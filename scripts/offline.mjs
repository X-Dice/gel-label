import { readFile, writeFile } from "node:fs/promises";
const html = await readFile("dist/index.html", "utf8");
const jsPath = html.match(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/,
)?.[1];
const cssPath = html.match(
  /<link rel="stylesheet" crossorigin href="([^"]+)">/,
)?.[1];
if (!jsPath || !cssPath) throw new Error("Unexpected Vite output");
const js = (
  await readFile("dist/" + jsPath.replace(/^\.\//, ""), "utf8")
).replace(/<\/script/gi, "<\\/script");
const css = await readFile("dist/" + cssPath.replace(/^\.\//, ""), "utf8");
const offline = html
  .replace(
    /<script type="module" crossorigin src="[^"]+"><\/script>/,
    () => `<script type="module">${js}</script>`,
  )
  .replace(
    /<link rel="stylesheet" crossorigin href="[^"]+">/,
    () => `<style>${css}</style>`,
  );
if (/<script[^>]+src=|<link[^>]+stylesheet/.test(offline))
  throw new Error("Offline app has external resources");
await writeFile("dist/GelLabel-offline.html", offline);
console.log("Built self-contained dist/GelLabel-offline.html");
