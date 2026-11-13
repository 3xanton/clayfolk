# AGENTS.md

## What this repo is
A free library of ~30 clay-style avatars (PNG, WebP, looping MP4) published as an npm package, with a one-page static site in `site/`. Premium packs come later and are NOT in this repo's free set.

## Source of truth
- `avatars.json`: one entry per avatar (id, name, mood, role, age, tags, alt). Edit this, never the generated files.
- `project.config.json`: name, display name, GitHub repo, tag.- `assets/{png,webp,mp4}/<id>.<ext>`: file names must match the avatar id.
- `provenance/<id>.json`: model, prompt, seed and edit notes for each avatar. Keep these. Gitignored (private, never committed or published); only `provenance/README.md` is tracked.

## Generated (do not edit by hand)
`packages/clayfolk/manifest.js`, `packages/clayfolk/assets/`, `llms.txt`, `site/avatars.json`. Run `pnpm build:manifest`.

## Commands
- `pnpm build:manifest`: validate avatars.json and regenerate everything.
- `pnpm check:sizes`: fail if bundled images exceed the size budget.

## Rules
- Images are bundled in the npm package; MP4s are NOT (they are served from GitHub via jsDelivr, pinned by `gitTag`).
- Every avatar needs an `alt` string.
- The site must not hardcode the pack size. The pack can grow (38, 56, ...) with no front-end change: no counts in copy, no fixed grid slots or loop lengths, filters and chips derived from `site/avatars.json`. Show a count only when rendered from `avatars.length`. Test the page with the list cut to 8 and padded to 56.
- Don't add dependencies without a reason. The package has zero runtime dependencies.
- Do not publish to npm or push tags without the owner's say-so.

## Site build
`pnpm build` also runs `scripts/build-site.mjs`, which copies images into `site/assets/` (`cutout/` from `assets/webp-cutout/`, plus `webp/`, `png/`), writes `site/assets/features.json` (`mp4: true` once `assets/mp4/` has files), `site/llms.txt` and `site/clayfolk.zip`. All of these are gitignored. `assets/webp-cutout/` (transparent, site-only) is NOT in the npm package. Fonts are self-hosted in `site/fonts/` (Geist, OFL). Site config (hero id, word list, waitlist endpoint) lives at the top of `site/app.js`.
