/*===== Players =====*/
export type PlayersSearch = {
  id: number;
  name: string;
}
export type TopPlayerData = {
  topBlitz: Player[];
  topRapid: Player[];
  topClassic: Player[];
};
export type TitledPlayer = {
  id: number;
  name: string;
  image_url?: string | null;
  rapid: number;
  players_to_titles: {
    titles: {
      title: string;
      short_title: string;
      type: string;
    };
  }[];
}

export type PlayerMain = {
  index?: number;
  id: number;
  name: string;
  nickname?: string | null;
  classic: number;
  rapid: number;
  blitz: number;
  image_url?: string | null;
  locations?: {
    flag?: string;
    name: string;
  } | null;
  defending_champions?:
  | {
    championships: {
      name: string;
    };
  }[]
  | null;
  players_to_titles?: {
    id: number;
    player_id: number;
    title_id: number;
    titles: {
      id: number;
      title: string;
      short_title: string;
      type: string;
    };
  }[] | null;
};

export type PlayerRating = {
  id: number;
  name: string;
  nickname?: string;
  rating: number;
  image?: string;
  shortTitle?: string;
  location?: {
    name: string;
    flag?: string;
  };
}

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

export interface PlayerProfile {
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

/*===== Announcements =====*/
export type Announcement = {
  id: number
  year: number
  number: number
  content: string
}

/*===== Circuits =====*/
export type Circuit = {
  name: string;
  type: string;
  circuit_phases: CircuitPhase[];
};

export type CircuitPhase = {
  id: number;
  order: number;
  tournaments: {
    name: string;
  };
  circuit_podiums: CircuitPodium[];
}

export type CircuitPodium = {
  category: string;
  place: string;
  points: number;
  players: CircuitPlayer;
  club_id: number;
}

export type CircuitPlayer = {
  id: number;
  name: string;
  nickname?: string | null;
  image_url?: string | null;
  players_to_titles?: {
    titles: {
      short_title: string;
      type: string;
    };
  }[] | null;
  total: number;
  category?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

export type CircuitClub = {
  clubName: string;
  clubLogo: string;
  total: number;
  pointsByPhase: Record<string, number>;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
};

/*===== Posts =====*/
export type LastPost = {
  id: string
  title: string
  image: string
}

export type Post = {
  id: string
  title: string
  image: string
  content: string
  slug: string
  created_at: string
}

/*===== Championships =====*/
export interface Championship {
  name: string;
  tournaments: Tournament[];
}

export type DefendingChampions = {
  id: number;
  tournaments: {
    date: string;
    tournament_podiums: {
      place: number;
      players: {
        id: number;
      };
    }[];
  }[];
};

export interface Tournament {
  name: string;
  date: string;
  tournament_podiums: TournamentPodium[];
}

export interface TournamentPodium {
  place: number;
  players: {
    id: number;
    name: string;
    nickname?: string | null;
    image_url?: string | null;
    locations?: {
      name: string;
    } | null;
    players_to_titles?: {
      titles: {
        short_title: string;
        type: string;
      };
    }[] | null;
    index?: number;
  }
}

export interface Location {
  name: string;
}

export interface PlayersToTitles {
  titles: Title;
}

export interface Title {
  short_title: string;
  type: string;
}

/*===== Links page =====*/
export type LinksGroup = {
  id: number;
  label: string;
  links?: Link[]
}

export type Link = {
  id: number;
  href: string;
  label: string;
  icon: string;
  order: number;
  link_group_id: number;
}

export type Role = {
  role: string;
  type: string;
  players_to_roles: {
    players: {
      name: string;
      image_url: string;
    }
  }[]
}

/*===== Clubs =====*/
export type Club = {
  name: string;
  logo: string;
  players: {
    id: number;
    name: string;
    nickname?: string | null;
    image_url?: string | null;
    players_to_titles?: {
      titles: {
        short_title: string;
        type: string;
      };
    }[] | null;
  }[] | null;
}

export type ClubPlayer = {
  id: number;
  name: string;
  nickname?: string | null;
  image_url?: string | null;
  players_to_titles?: {
    titles: {
      short_title: string;
      type: string;
    };
  }[] | null;
}

/*===== Clubs =====*/
export interface Cup {
  id: number;
  name: string;
  image_url: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  rhythm: string;
  cup_groups: CupGroup[];
  cup_brackets: CupBracket[];
}

export interface CupGroup {
  id: number;
  name: string;
  order: number;
  cup_rounds: CupRound[];
  cup_players: CupPlayer[];
}

export interface CupBracket {
  bracket_type: string;
  cup_playoffs: CupPlayoff[];
}

export interface CupRound {
  order: number;
  cup_matches: CupMatch[];
}

export interface CupPlayer {
  id: number;
  players: CupPlayerInfo;
  nickname: string | null;
  position: number | null;
}

export interface CupMatch {
  id: number;
  date: string;
  order: number;
  best_of: number;
  cup_games: CupGame[];
  player_one_id: CupPlayerInfo;
  player_two_id: CupPlayerInfo;
  winner_id: CupPlayerInfo | null;
}

export interface CupPlayerInfo {
  id?: number | null;
  name: string;
  image_url: string | null;
}

export interface CupGame {
  id: number;
  game_number: number;
  winner_id: number;
  link: string;
}

export interface CupPlayoff {
  order: number;
  phase_type: string;
  cup_matches: CupMatch[];
}

export type PaginatedNewsParams = {
  pageNumber: string;
};

export type NewsPageProps = {
  params: PaginatedNewsParams;
};