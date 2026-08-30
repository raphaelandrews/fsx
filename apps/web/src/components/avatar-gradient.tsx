// Deterministic avatar gradients keyed by id (cycled through the palette).
const GRADIENTS = [
  "bg-gradient-to-tr from-blue-400 to-indigo-500",
  "bg-gradient-to-tr from-rose-400 to-red-500",
  "bg-gradient-to-tr from-amber-400 to-orange-500",
  "bg-gradient-to-tr from-emerald-400 to-teal-500",
  "bg-gradient-to-tr from-fuchsia-400 to-purple-500",
  "bg-gradient-to-tr from-cyan-400 to-blue-500",
] as const;

export function avatarGradient(id: number): string {
  return GRADIENTS[Math.abs(id) % GRADIENTS.length]!;
}

/** Gradient selected deterministically from any string key (e.g. a club name). */
export function avatarGradientFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}
