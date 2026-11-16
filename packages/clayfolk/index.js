import { avatars, meta } from "./manifest.js";

export { avatars, meta };

const SITE = "https://clayfolk.dev";
const NPM_CDN = `https://cdn.jsdelivr.net/npm/${meta.name}@${meta.version}/assets`;

// Ids are zero-padded strings ("001"); accept 1, "1" or "001".
const normId = (id) => (/^\d+$/.test(String(id)) ? String(id).padStart(3, "0") : String(id));

/** Find one avatar by id (1, "1" and "001" all work). Returns undefined if not found. */
export function getAvatar(id) {
  const n = normId(id);
  return avatars.find((a) => a.id === n);
}

/** Filter avatars by any combination of mood, role, age or tag. */
export function findAvatars({ mood, role, age, presentation, tag } = {}) {
  return avatars.filter(
    (a) =>
      (!mood || a.mood === mood) &&
      (!role || a.role === role) &&
      (!age || a.age === age) &&
      (!presentation || a.presentation === presentation) &&
      (!tag || (a.tags ?? []).includes(tag))
  );
}

/**
 * URL of the still image (WebP, 512px). Works in plain <img> tags.
 * Default: the avatar on its colored background.
 * variant "cutout": the avatar on a transparent background.
 * PNGs are not in the package; download them from the website.
 */
export function imageUrl(id, { format = "webp", variant = "default" } = {}) {
  const a = getAvatar(id);
  if (!a) throw new Error(`${meta.name}: unknown avatar id "${id}"`);
  if (format === "png") throw new Error(`${meta.name}: PNGs are not in the package, download them at ${SITE}`);
  if (format !== "webp") throw new Error(`${meta.name}: format must be "webp"`);
  if (variant !== "default" && variant !== "cutout") throw new Error(`${meta.name}: variant must be "default" or "cutout"`);
  return `${NPM_CDN}/${variant === "cutout" ? "webp-cutout" : "webp"}/${a.id}.webp`;
}

/** URL of the looping MP4 (720px, bundled in the package, served through jsDelivr). */
export function videoUrl(id) {
  const a = getAvatar(id);
  if (!a) throw new Error(`${meta.name}: unknown avatar id "${id}"`);
  return `${NPM_CDN}/mp4/${a.id}.mp4`;
}
