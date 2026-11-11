# Provenance

One JSON file per avatar, named `<id>.json`, recording how it was made:

```json
{
  "id": "001",
  "imageModel": "google/nano-banana-2.1",
  "videoModel": "alibaba/wan-3.0-prime/image-to-video",
  "prompt": "...",
  "videoPrompt": "...",
  "seed": 0,
  "generatedOn": "2026-11-xx",
  "manualEdits": "what you changed by hand"
}
```

Keep these. They are your record if anyone ever asks where an asset came from.
