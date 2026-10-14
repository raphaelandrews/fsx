export type OgKind = "player" | "post";

interface OgPlayer {
  name: string;
  nickname: string | null;
  classic: number;
  rapid: number;
  blitz: number;
  club: { name: string } | null;
  playersToTitles: { title: { shortName: string } }[];
  tournamentPodiums: { place: number; category: string | null }[];
}

export interface PlayerCard {
  name: string;
  nickname: string | null;
  ratings: { classic: number; rapid: number; blitz: number };
  club: string | null;
  titles: string[];
  medals: { gold: number; silver: number; bronze: number };
}

// The only data an image shows: the page's head and the image route both derive it from the same procedure
// result, so the version in the URL changes exactly when the image would.
export function playerCard(player: OgPlayer): PlayerCard {
  const overall = player.tournamentPodiums.filter((podium) => !podium.category);
  return {
    name: player.name,
    nickname: player.nickname,
    ratings: { classic: player.classic, rapid: player.rapid, blitz: player.blitz },
    club: player.club?.name ?? null,
    titles: player.playersToTitles.map((entry) => entry.title.shortName),
    medals: {
      gold: overall.filter((podium) => podium.place === 1).length,
      silver: overall.filter((podium) => podium.place === 2).length,
      bronze: overall.filter((podium) => podium.place === 3).length,
    },
  };
}

export interface PostCard {
  title: string;
}

// FNV-1a: a short, stable fingerprint to bust crawler caches, not a security hash.
export function ogVersion(card: PlayerCard | PostCard): string {
  let hash = 0x811c9dc5;
  for (const char of JSON.stringify(card)) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export const ogImagePath = (kind: OgKind, id: number | string, card: PlayerCard | PostCard) =>
  `/api/og/${kind}/${encodeURIComponent(String(id))}.png?v=${ogVersion(card)}`;
