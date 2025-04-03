export type SearchPlayersType = {
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
  image_url?: string | null;
  cbx_id?: number | null
  fide_id?: number | null
  verified: boolean;
  clubs?: {
    name: string
    logo?: string | null;
  } | null;
  locations?: {
    flag?: string | null;
    name: string;
  } | null;
  defending_champions?:
  | {
    championships: {
      name: string;
    };
  }[]
  | null;
  players_to_tournaments?: {
    rating_type: string;
    old_rating: number;
    variation: number;
    tournaments: {
      name: string;
    }
  }[] | null;
  tournament_podiums: {
    place: number;
    tournaments: {
      name: string;
      championship_id: number;
    }
  }[] | null;
  players_to_roles?: {
    roles: {
      role: string;
      short_role: string;
      type: string
    }
  }[] | null;
  players_to_titles?: {
    titles: {
      title: string;
      short_title: string;
      type: string;
    };
  }[] | null;
}