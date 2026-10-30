import { copyFile, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
await mkdir("release", { recursive: true });
await copyFile("dist/GelLabel-offline.html", "GelLabel-offline.html");
await copyFile("dist/GelLabel-offline.html", "release/GelLabel-offline.html");
await copyFile("docs/RELEASE_NOTES.md", "release/RELEASE_NOTES.md");
const bytes = await readFile("release/GelLabel-offline.html");
await writeFile(
  "release/SHA256SUMS.txt",
  createHash("sha256").update(bytes).digest("hex") +
    "  GelLabel-offline.html\n",
);
console.log(
  "Prepared release/ with offline HTML, release notes, and SHA-256 checksum.",
);
