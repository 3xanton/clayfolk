// Prepares site/ for static hosting. Run after build-manifest (it reads site/avatars.json).
// Generates (all gitignored): site/assets/{cutout,webp,png}/, site/clayfolk.zip
//   cutout = assets/webp-cutout (transparent; used by the canvas + hero, also shipped in the npm package)
//   webp/png = colored tiles (hover, detail, examples) and downloads
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const out = join(site, "assets");
rmSync(out, { recursive: true, force: true });
for (const [src, dst] of [["webp-cutout", "cutout"], ["webp", "webp"], ["png", "png"], ["png-cutout", "png-cutout"]]) {
  const from = join(root, "assets", src);
  if (existsSync(from)) cpSync(from, join(out, dst), { recursive: true });
  else console.warn(`warning: assets/${src} missing, site will fall back where it can`);
}

// --- clayfolk.zip: every avatar in each format + manifest + llms.txt + licenses ---
const { meta, avatars } = JSON.parse(readFileSync(join(site, "avatars.json"), "utf8"));
const stage = join(root, "dist", "zip", "clayfolk");
rmSync(join(root, "dist", "zip"), { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
for (const [dir, dst] of [["png", "png"], ["png-cutout", "png-cutout"], ["webp", "webp"], ["webp-cutout", "cutout"], ["mp4", "mp4"]]) {
  const from = join(root, "assets", dir);
  if (existsSync(from) && readdirSync(from).length) cpSync(from, join(stage, dst), { recursive: true });
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
// feature flags the page reads (MP4s ship in the npm package; the site serves its own copies)
const mp4Dir = join(root, "assets", "mp4");
const mp4Ids = existsSync(mp4Dir) ? readdirSync(mp4Dir).filter((f) => f.endsWith(".mp4")).map((f) => f.slice(0, -4)).sort() : [];
// copy local MP4s so the page can be tried before the tag is pushed (site/assets is gitignored)
if (mp4Ids.length) cpSync(mp4Dir, join(out, "mp4"), { recursive: true });
// mp4Ids: only these avatars get hover/detail video and an MP4 download until the full set exists
writeFileSync(join(out, "features.json"), JSON.stringify({ mp4: mp4Ids.length > 0, mp4Ids }));
if (existsSync(join(root, "llms.txt"))) cpSync(join(root, "llms.txt"), join(site, "llms.txt"));
console.log(`site: copied images for ${avatars.length} avatars`);
