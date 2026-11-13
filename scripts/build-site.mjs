// Prepares site/ for static hosting. Run after build-manifest (it reads site/avatars.json).
// Generates (all gitignored): site/assets/{cutout,webp,png}/, site/clayfolk.zip
//   cutout = assets/webp-cutout (transparent, canvas + hero, site only, NOT in the npm package)
//   webp/png = colored tiles (hover, detail, examples) and downloads
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const out = join(site, "assets");
rmSync(out, { recursive: true, force: true });
for (const [src, dst] of [["webp-cutout", "cutout"], ["webp", "webp"], ["png", "png"]]) {
  const from = join(root, "assets", src);
  if (existsSync(from)) cpSync(from, join(out, dst), { recursive: true });
  else console.warn(`warning: assets/${src} missing, site will fall back where it can`);
}

// --- clayfolk.zip: every avatar in each format + manifest + llms.txt + licenses ---
const { meta, avatars } = JSON.parse(readFileSync(join(site, "avatars.json"), "utf8"));
const stage = join(root, "dist", "zip", "clayfolk");
rmSync(join(root, "dist", "zip"), { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
for (const dir of ["png", "webp", "mp4"]) {
  const from = join(root, "assets", dir);
  if (existsSync(from) && readdirSync(from).length) cpSync(from, join(stage, dir), { recursive: true });
}
writeFileSync(join(stage, "manifest.json"), JSON.stringify({ meta, avatars }, null, 2));
for (const f of ["llms.txt", "LICENSE", "ASSETS-LICENSE.md"]) if (existsSync(join(root, f))) cpSync(join(root, f), join(stage, f));
const zipPath = join(site, "clayfolk.zip");
rmSync(zipPath, { force: true });
try {
  execFileSync("zip", ["-qr", zipPath, "clayfolk"], { cwd: join(root, "dist", "zip") });
  console.log("site: wrote site/clayfolk.zip");
} catch {
  console.warn("warning: `zip` not found, site/clayfolk.zip not built (Download .zip will 404)");
}
// feature flags the page reads (MP4s are served from GitHub via jsDelivr once they exist and the tag is pushed)
const mp4Dir = join(root, "assets", "mp4");
const mp4 = existsSync(mp4Dir) && readdirSync(mp4Dir).some((f) => f.endsWith(".mp4"));
writeFileSync(join(out, "features.json"), JSON.stringify({ mp4 }));
if (existsSync(join(root, "llms.txt"))) cpSync(join(root, "llms.txt"), join(site, "llms.txt"));
console.log(`site: copied images for ${avatars.length} avatars`);
