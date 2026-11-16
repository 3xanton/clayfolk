// Encodes raw video masters (masters/mp4/<id>.mp4, gitignored) into the small
// loops that ship (assets/mp4/<id>.mp4). Needs ffmpeg on PATH (dev tool only,
// not run by `pnpm build`). Usage: pnpm encode:videos [id ...]
//   720x720, H.264 High yuv420p, CRF 23, no audio, faststart.
//   Color: fal's clips are untagged and their pixels are BT.601 YCbCr. Browsers guess BT.709 for
//   untagged HD video, which shifts colors (backgrounds no longer match the stills). So we convert
//   601 -> 709 explicitly and tag the output as BT.709.
//   All frames kept, including the last. fal's loops end by landing in the starting pose, so the
//   last frame is that landing; dropping it left a visible jump at the loop seam (up to 7x a
//   normal step on half the clips). Keeping it costs a 1-frame hold at the seam, which the pause hides.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "masters", "mp4");
const out = join(root, "assets", "mp4");
const SIZE = 720, CRF = 23;

if (!existsSync(src)) { console.error("masters/mp4/ not found, nothing to encode"); process.exit(1); }
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); }
catch { console.error("ffmpeg not found on PATH"); process.exit(1); }

mkdirSync(out, { recursive: true });
const only = new Set(process.argv.slice(2));
const files = readdirSync(src).filter((f) => f.endsWith(".mp4") && (!only.size || only.has(f.slice(0, -4)))).sort();
let total = 0;
for (const f of files) {
  const frames = Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", join(src, f)]).toString().trim());
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", join(src, f),
    "-vf", `scale=${SIZE}:${SIZE}:flags=lanczos:in_color_matrix=bt601:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p`, "-frames:v", String(frames), "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(CRF), "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
    "-movflags", "+faststart", join(out, f)]);
  const kb = statSync(join(out, f)).size / 1024; total += kb;
  console.log(`${f}: ${frames} frames, ${kb.toFixed(0)} KB`);
}
console.log(`encoded ${files.length} video(s), ${(total / 1024).toFixed(2)} MB total`);
