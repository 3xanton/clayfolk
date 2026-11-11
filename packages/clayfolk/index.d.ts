export interface Avatar {
  id: string;
  name: string;
  mood: string;
  role: string;
  age: string;
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
export function findAvatars(filter?: { mood?: string; role?: string; age?: string; tag?: string }): Avatar[];
export function imageUrl(id: string | number, options?: { format?: "png" | "webp" }): string;
export function videoUrl(id: string | number): string;
