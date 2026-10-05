import {
  CrownIcon,
  Loading01Icon,
  Medal01Icon,
  MedalFirstPlaceIcon,
  MedalThirdPlaceIcon,
  RabbitIcon,
  SwordsIcon,
  TrainIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";

// Keyed by championship id, not name: names are editable in the admin, ids are not.
const CHAMPIONSHIP_ICONS: Record<number, typeof CrownIcon> = {
  1: Loading01Icon,
  2: RabbitIcon,
  3: ZapIcon,
  4: CrownIcon,
  5: SwordsIcon,
  6: TrainIcon,
};

export const championshipIcon = (championshipId: number | null | undefined) =>
  (championshipId != null ? CHAMPIONSHIP_ICONS[championshipId] : undefined) ?? MedalFirstPlaceIcon;

const PLACE_ICONS = { 1: MedalFirstPlaceIcon, 2: Medal01Icon, 3: MedalThirdPlaceIcon } as const;

// A championship win shows the championship's icon; other places and category podiums show a medal.
export function podiumIcon(place: number | null | undefined, championshipId: number | null | undefined) {
  if (place === 1 && championshipId != null && CHAMPIONSHIP_ICONS[championshipId]) return CHAMPIONSHIP_ICONS[championshipId];
  return place === 1 || place === 2 || place === 3 ? PLACE_ICONS[place] : undefined;
}
