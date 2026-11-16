export interface Avatar {
  id: string;
  name: string;
  mood: string;
  role: string;
  age: string;
  presentation: "feminine" | "masculine" | "androgynous";
  tags?: string[];
  alt: string;
}

export interface Meta {
  name: string;
  version: string;
  githubRepo: string;
  gitTag: string;
}

export const avatars: Avatar[];
export const meta: Meta;

export function getAvatar(id: string | number): Avatar | undefined;
export function findAvatars(filter?: { mood?: string; role?: string; age?: string; presentation?: string; tag?: string }): Avatar[];
export function imageUrl(
  id: string | number,
  options?: { format?: "webp"; variant?: "default" | "cutout" } // cutout = transparent background. PNGs are site-only.
): string;
export function videoUrl(id: string | number): string;
