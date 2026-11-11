// Fails if bundled images would make the npm package too heavy.
import { readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIMIT_MB = 15; // budget for bundled png + webp
let total = 0;
for (const dir of ["png", "webp"]) {
  const p = join(root, "assets", dir);
  if (!existsSync(p)) continue;
  for (const f of readdirSync(p)) total += statSync(join(p, f)).size;
}
const mb = total / 1024 / 1024;
console.log(`Bundled images: ${mb.toFixed(1)} MB (limit ${LIMIT_MB} MB)`);
if (mb > LIMIT_MB) process.exit(1);
