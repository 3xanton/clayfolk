// Fails if bundled images would make the npm package too heavy.
import { readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIMIT_MB = 15; // budget for everything bundled in the npm package (webp, webp-cutout, mp4)
let total = 0;
for (const dir of ["webp", "webp-cutout", "mp4"]) {
  const p = join(root, "assets", dir);
  if (!existsSync(p)) continue;
  for (const f of readdirSync(p)) total += statSync(join(p, f)).size;
}
const mb = total / 1024 / 1024;
console.log(`Bundled in package (webp + cutout + mp4): ${mb.toFixed(1)} MB (limit ${LIMIT_MB} MB)`);
if (mb > LIMIT_MB) process.exit(1);

// The MP4 set alone should stay small too.
const MP4_LIMIT_MB = 10;
let mp4Total = 0;
const mp4Dir = join(root, "assets", "mp4");
if (existsSync(mp4Dir)) for (const f of readdirSync(mp4Dir)) mp4Total += statSync(join(mp4Dir, f)).size;
const mp4Mb = mp4Total / 1024 / 1024;
console.log(`MP4 loops: ${mp4Mb.toFixed(1)} MB (limit ${MP4_LIMIT_MB} MB)`);
if (mp4Mb > MP4_LIMIT_MB) process.exit(1);
