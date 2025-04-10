import {
  CrownIcon,
  MedalIcon,
  RabbitIcon,
  SwordsIcon,
  TurtleIcon,
  ZapIcon,
} from "lucide-react";

export function FormatPodium(
  place: number | null | undefined,
  championship_id: number
) {
  if (place === 1 && championship_id === 1) {
    return <TurtleIcon width={24} height={24} />;
  }

  if (place === 1 && championship_id === 2) {
    return <RabbitIcon width={24} height={24} />;
  }

  if (place === 1 && championship_id === 3) {
    return <ZapIcon width={24} height={24} />;
  }

  if (place === 1 && championship_id === 4) {
    return <CrownIcon width={24} height={24} />;
  }

  if (place === 1 && championship_id === 5) {
    return <SwordsIcon width={24} height={24} />;
  }

  if (place === 2) {
    return <MedalIcon width={24} height={24} />;
  }
}

export function FormatPodiumTitle(place: number | null | undefined) {
  if (place === 1) {
    return "Campeão(ã)";
  }
  if (place === 2) {
    return "Vice-Campeão(ã)";
  }
}
