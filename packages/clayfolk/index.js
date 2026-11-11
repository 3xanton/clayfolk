import { avatars, meta } from "./manifest.js";

export { avatars, meta };

const NPM_CDN = `https://cdn.jsdelivr.net/npm/${meta.name}@${meta.version}/assets`;
const GH_CDN = `https://cdn.jsdelivr.net/gh/${meta.githubRepo}@${meta.gitTag}/assets`;

/** Find one avatar by id. Returns undefined if not found. */
export function getAvatar(id) {
  return avatars.find((a) => a.id === String(id));
}

/** Filter avatars by any combination of mood, role, age or tag. */
export function findAvatars({ mood, role, age, tag } = {}) {
  return avatars.filter(
    (a) =>
      (!mood || a.mood === mood) &&
      (!role || a.role === role) &&
      (!age || a.age === age) &&
      (!tag || (a.tags ?? []).includes(tag))
  );
}

/** URL of the still image. Works in plain <img> tags. */
export function imageUrl(id, { format = "png" } = {}) {
  if (!getAvatar(id)) throw new Error(`${meta.name}: unknown avatar id "${id}"`);
  if (format !== "png" && format !== "webp") throw new Error(`${meta.name}: format must be "png" or "webp"`);
  return `${NPM_CDN}/${format}/${id}.${format}`;
}

/** URL of the looping MP4 (served from GitHub through jsDelivr, not bundled in the package). */
export function videoUrl(id) {
  if (!getAvatar(id)) throw new Error(`${meta.name}: unknown avatar id "${id}"`);
  return `${GH_CDN}/mp4/${id}.mp4`;
}
