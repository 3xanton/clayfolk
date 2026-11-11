# AGENTS.md

## What this repo is
A free library of ~30 clay-style avatars (PNG, WebP, looping MP4) published as an npm package, with a one-page static site in `site/`. Premium packs come later and are NOT in this repo's free set.

## Source of truth
- `avatars.json`: one entry per avatar (id, name, mood, role, age, tags, alt). Edit this, never the generated files.
- `project.config.json`: name, display name, GitHub repo, tag.- `assets/{png,webp,mp4}/<id>.<ext>`: file names must match the avatar id.
- `provenance/<id>.json`: model, prompt, seed and edit notes for each avatar. Keep these.

## Generated (do not edit by hand)
`packages/clayfolk/manifest.js`, `packages/clayfolk/assets/`, `llms.txt`, `site/avatars.json`. Run `pnpm build:manifest`.

## Commands
- `pnpm build:manifest`: validate avatars.json and regenerate everything.
- `pnpm check:sizes`: fail if bundled images exceed the size budget.

## Rules
- Images are bundled in the npm package; MP4s are NOT (they are served from GitHub via jsDelivr, pinned by `gitTag`).
- Every avatar needs an `alt` string.
- Don't add dependencies without a reason. The package has zero runtime dependencies.
- Do not publish to npm or push tags without the owner's say-so.
