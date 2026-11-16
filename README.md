<h1 align="center">Clayfolk</h1>

<p align="center">
  <img alt="Clay-style avatars: an afro with pencils, a pink-and-blue bob, an astronaut, a chef, a blue turban, a viking, an office cat and a swirl-eyed character" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/002.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/009.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/012.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/022.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/024.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/007.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/018.webp" width="100">
  <img alt="" src="https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp-cutout/029.webp" width="100">
</p>

<p align="center">
  <b>Free clay-style avatars for mockups, prototypes and UIs.</b><br>
  WebP and looping MP4 on npm. PNGs to download. A manifest your LLM can read.
</p>

<p align="center">
  <a href="https://clayfolk.dev">Website</a> ·
  <a href="https://www.npmjs.com/package/clayfolk">npm</a> ·
  <a href="https://clayfolk.dev/llms.txt">llms.txt</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/clayfolk"><img alt="npm version" src="https://img.shields.io/npm/v/clayfolk?color=6b7cff&labelColor=1a1614"></a>
  <a href="https://www.npmjs.com/package/clayfolk"><img alt="npm downloads" src="https://img.shields.io/npm/dm/clayfolk?color=6b7cff&labelColor=1a1614"></a>
  <a href="./ASSETS-LICENSE.md"><img alt="Free for commercial use" src="https://img.shields.io/badge/avatars-free%20for%20commercial%20use-6b7cff?labelColor=1a1614"></a>
  <a href="./LICENSE"><img alt="Code license: MIT" src="https://img.shields.io/badge/code-MIT-6b7cff?labelColor=1a1614"></a>
</p>

## Install

```bash
npm i clayfolk
```

Zero runtime dependencies. Ships TypeScript types.

## Use

```js
import { avatars, findAvatars, imageUrl, videoUrl } from "clayfolk";

const [pick] = findAvatars({ mood: "happy", role: "creative" });
imageUrl(pick.id);                        // .../webp/002.webp (512px, colored background)
imageUrl(pick.id, { variant: "cutout" }); // .../webp-cutout/002.webp (transparent background)
videoUrl(pick.id);                        // .../mp4/002.mp4 (looping, 720px)
```

Every avatar has an `alt` string, a mood, a role, an age and tags, so you can pick by what the UI needs instead of by number.

No bundler? Use the CDN URLs directly, for example
`https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp/001.webp`.

## What's in the box

| Format | Where | Notes |
| --- | --- | --- |
| WebP, colored background | npm | 512px |
| WebP, transparent cutout | npm | 512px |
| MP4 loops | npm | 720px, looping |
| PNG, colored and transparent | [clayfolk.dev](https://clayfolk.dev) | for Figma and other design tools |

The website also offers one zip with everything, plus the manifest and licenses.

## Use with an LLM

Paste this into your prompt or `CLAUDE.md` / `AGENTS.md`:

> Use the `clayfolk` npm package for placeholder avatars. Read `llms.txt` (in the package or at the site URL) to pick an avatar by mood, role, age, presentation or tags. Use `imageUrl(id)` for images and `videoUrl(id)` for looping video, and always set `alt` from the manifest.

The full machine-readable list is in [`llms.txt`](./llms.txt).

## License

- **Code:** MIT.
- **Avatars:** free for personal and commercial use, including client work and open-source projects. Don't resell or redistribute them as a standalone pack. Attribution is appreciated, not required. Full terms in [ASSETS-LICENSE.md](./ASSETS-LICENSE.md).

The avatars were generated with AI image and video models, then edited by hand.

## Contributing / development

See [AGENTS.md](./AGENTS.md).
