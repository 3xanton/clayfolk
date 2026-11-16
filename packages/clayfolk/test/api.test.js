import { test } from "node:test";
import assert from "node:assert/strict";
import { avatars, meta, getAvatar, findAvatars, imageUrl, videoUrl } from "../index.js";

test("manifest has avatars with required fields", () => {
  assert.ok(avatars.length > 0);
  for (const a of avatars) {
    for (const k of ["id", "name", "mood", "role", "age", "presentation", "alt"]) assert.ok(a[k], `${a.id} missing ${k}`);
  }
  assert.equal(new Set(avatars.map((a) => a.id)).size, avatars.length);
});

test("getAvatar accepts 1, '1' and '001'", () => {
  assert.equal(getAvatar(1)?.id, "001");
  assert.equal(getAvatar("1")?.id, "001");
  assert.equal(getAvatar("001")?.id, "001");
  assert.equal(getAvatar("999"), undefined);
});

test("findAvatars filters by mood, role, presentation and tag", () => {
  const happy = findAvatars({ mood: "happy" });
  assert.ok(happy.length > 0 && happy.every((a) => a.mood === "happy"));
  assert.ok(findAvatars({ presentation: "feminine" }).every((a) => a.presentation === "feminine"));
  assert.equal(findAvatars({ mood: "nonexistent" }).length, 0);
  assert.equal(findAvatars().length, avatars.length);
});

test("imageUrl builds npm CDN WebP urls with the padded id", () => {
  assert.equal(imageUrl(1), `https://cdn.jsdelivr.net/npm/${meta.name}@${meta.version}/assets/webp/001.webp`);
  assert.ok(imageUrl("002", { format: "webp" }).endsWith("/assets/webp/002.webp"));
  assert.throws(() => imageUrl("999"), /unknown avatar id/);
  assert.throws(() => imageUrl("001", { format: "gif" }), /format must be/);
});

test("PNGs are not in the package", () => {
  assert.throws(() => imageUrl("001", { format: "png" }), /not in the package/);
});

test("imageUrl supports the transparent cutout variant", () => {
  assert.ok(imageUrl("001", { variant: "cutout" }).endsWith("/assets/webp-cutout/001.webp"));
  assert.ok(imageUrl(2, { variant: "cutout", format: "webp" }).endsWith("/assets/webp-cutout/002.webp"));
  assert.throws(() => imageUrl("001", { variant: "weird" }), /variant must be/);
});

test("videoUrl points at the bundled MP4 on the npm CDN", () => {
  assert.equal(videoUrl(12), `https://cdn.jsdelivr.net/npm/${meta.name}@${meta.version}/assets/mp4/012.mp4`);
  assert.throws(() => videoUrl("999"), /unknown avatar id/);
});
