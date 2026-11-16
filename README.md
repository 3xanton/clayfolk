# Clayfolk

30 free clay-style avatars for mockups and UIs. WebP and looping MP4 in the package, plus PNGs on the website. Made for designers who work in code, with a manifest that LLMs can read.

## Install

```bash
npm i clayfolk
```

## Use

```js
import { avatars, findAvatars, imageUrl, videoUrl } from "clayfolk";

const [pick] = findAvatars({ mood: "happy", role: "creative" });
imageUrl(pick.id);                        // .../webp/002.webp (512px, colored background)
imageUrl(pick.id, { variant: "cutout" }); // .../webp-cutout/002.webp (transparent background)
videoUrl(pick.id);                        // .../mp4/002.mp4 (looping, 720px)
```

No bundler? Use the CDN URLs directly, for example
`https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/webp/001.webp`.

## PNGs for design tools

The package ships WebP (colored and transparent) and MP4. PNGs, including transparent cutouts, are free to download on the website: https://clayfolk.dev

## Use with an LLM

Paste this into your prompt or `CLAUDE.md` / `AGENTS.md`:

> Use the `clayfolk` npm package for placeholder avatars. Read `llms.txt` (in the package or at the site URL) to pick an avatar by mood, role, age, presentation or tags. Use `imageUrl(id)` for images and `videoUrl(id)` for looping video, and always set `alt` from the manifest.

The full machine-readable list is in [`llms.txt`](./llms.txt).

## License

Code: MIT. Avatars: see [ASSETS-LICENSE.md](./ASSETS-LICENSE.md). Free for commercial use; do not resell the set.

## Contributing / development

See [AGENTS.md](./AGENTS.md).
