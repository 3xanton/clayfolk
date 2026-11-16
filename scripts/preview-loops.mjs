// Dev-only loop previewer: original masters vs encoded loops, side by side.
//   pnpm preview:loops        (PORT=4174 by default)
// Serves tools/loop-preview/, masters/mp4/ and assets/mp4/ with HTTP Range
// support (needed for video seeking). Nothing else in the repo is exposed.
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 4174;
const dirs = { masters: join(root, "masters", "mp4"), encoded: join(root, "assets", "mp4") };

const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".mp4")) : [])
  .reduce((o, f) => ((o[f.slice(0, -4)] = statSync(join(dir, f)).size), o), {});

function send(res, code, body, type = "text/plain") {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

function serveFile(req, res, file, type) {
  if (!existsSync(file)) return send(res, 404, "not found");
  const size = statSync(file).size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  const headers = { "content-type": type, "accept-ranges": "bytes", "cache-control": "no-store" };
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start > end || start >= size) { res.writeHead(416, { "content-range": `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, "content-length": size });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = decodeURIComponent(url.pathname);
  if (p === "/" || p === "/index.html") return serveFile(req, res, join(root, "tools", "loop-preview", "index.html"), "text/html; charset=utf-8");
  if (p === "/api/list") {
    const avatars = JSON.parse(readFileSync(join(root, "avatars.json"), "utf8")).avatars;
    return send(res, 200, JSON.stringify({ avatars, masters: list(dirs.masters), encoded: list(dirs.encoded) }), "application/json");
  }
  const m = /^\/(masters|encoded)\/(\d{3})\.mp4$/.exec(p);
  if (m) return serveFile(req, res, join(dirs[m[1]], `${m[2]}.mp4`), "video/mp4");
  send(res, 404, "not found");
}).listen(PORT, () => console.log(`loop preview: http://localhost:${PORT}`));
