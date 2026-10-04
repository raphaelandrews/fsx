type TitleLink = { title: { name: string; tier?: number } };

// Highest tier first; titles of the same tier keep their recorded order.
export const byTitleTier = <T extends TitleLink>(links: readonly T[]) =>
  [...links].sort((a, b) => (b.title.tier ?? 1) - (a.title.tier ?? 1));
