# Clayfolk

30 free clay-style avatars for mockups and UIs. PNG, WebP and looping MP4. Made for designers who work in code, with a manifest that LLMs can read.

## Install

```bash
npm i clayfolk
```

## Use

```js
import { avatars, findAvatars, imageUrl, videoUrl } from "clayfolk";

const [pick] = findAvatars({ mood: "happy", role: "developer" });
imageUrl(pick.id);                    // .../png/001.png
imageUrl(pick.id, { format: "webp" });
videoUrl(pick.id);                    // looping mp4 via jsDelivr
```

No bundler? Use the CDN URLs directly, for example
`https://cdn.jsdelivr.net/npm/clayfolk@latest/assets/png/001.png`.

## Use with an LLM

Paste this into your prompt or `CLAUDE.md` / `AGENTS.md`:

> Use the `clayfolk` npm package for placeholder avatars. Read `llms.txt` (in the package or at the site URL) to pick an avatar by mood, role, age or tags. Use `imageUrl(id)` for images and `videoUrl(id)` for looping video, and always set `alt` from the manifest.

The full machine-readable list is in [`llms.txt`](./llms.txt).

## License

Code: MIT. Avatars: see [ASSETS-LICENSE.md](./ASSETS-LICENSE.md). Free for commercial use; do not resell the set.

## Contributing / development

See [AGENTS.md](./AGENTS.md).
