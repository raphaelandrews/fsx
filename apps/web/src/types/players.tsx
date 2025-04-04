export type SearchPlayerType = {
  id: string;
  name: string;
};

export type PlayerProfileType = {
  id: number;
  name: string;
  nickname?: string | null;
  classic: number;
  rapid: number;
  blitz: number;
  active: boolean;
  imageUrl?: string | null;
  cbxId?: number | null;
  fideId?: number | null;
  verified: boolean;
  club?: {
    name: string;
    logo?: string | null;
  } | null;
  location?: {
    flag?: string | null;
    name: string;
  } | null;
  defendingChampions?:
    | {
        championships: {
          name: string;
        };
      }[]
    | null;
  playersToTournaments?:
    | {
        ratingType: string;
        oldRating: number;
        variation: number;
        tournament: {
          name: string;
        };
      }[]
    | null;
  tournamentPodiums:
    | {
        place: number;
        tournament: {
          name: string;
          championshipId: number;
        };
      }[]
    | null;
  playersToRoles?:
    | {
        role: {
          role: string;
          shortRole: string;
          type: string;
        };
      }[]
    | null;
  playersToTitles?:
    | {
        title: {
          title: string;
          shortTitle: string;
          type: string;
        };
      }[]
    | null;
};

export type TopPlayerDataType = {
  topBlitz: TopPlayerType[];
  topRapid: TopPlayerType[];
  topClassic: TopPlayerType[];
};

export type TopPlayerType = {
  id: number;
  name: string;
  nickname?: string | null;
  classic: number;
  rapid: number;
  blitz: number;
  imageUrl?: string | null;
  locations?: {
    flag?: string | null;
    name: string;
  } | null;
  defendingChampions?:
    | {
        championships: {
          name: string;
        };
      }[]
    | null;
  playersToTitles?:
    | {
        titles: {
          title: string;
          shortTitle: string;
          type: string;
        };
      }[]
    | null;
};

export type Player = {
  id: number;
  name: string;
  nickname?: string | null;
  classic: number;
  rapid: number;
  blitz: number;
  imageUrl?: string | null;
  birth?: Date | null | string;
  sex: boolean;
  clubs?: {
    name: string
    logo?: string | null;
  } | null;
  locations?: {
    flag?: string;
    name: string;
  } | null;
  defendingChampions?:
  | {
    championships: {
      name: string;
    };
  }[]
  | null;
  playersToTitles?: {
    id: number;
    playerId: number;
    titleId: number;
    titles: {
      id: number;
      title: string;
      shortTitle: string;
      type: string;
    };
  }[] | null;
  index?: number;
}