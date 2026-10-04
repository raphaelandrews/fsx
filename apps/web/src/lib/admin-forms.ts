import {
  CIRCUIT_TYPE_LABELS,
  CIRCUIT_TYPES,
  COMPETITION_CATEGORIES,
  COMPETITION_TIER_LABELS,
  COMPETITION_TIERS,
} from "@fsx/api/circuit-types";

import type { EntitySection } from "@/components/admin/entity-form";
import type { useTRPC } from "@/utils/trpc";

type TRPC = ReturnType<typeof useTRPC>;

const RATING_TYPE_OPTIONS = [
  { value: "classic", label: "Classic" },
  { value: "rapid", label: "Rapid" },
  { value: "blitz", label: "Blitz" },
] as const;

export const TIER_OPTIONS = COMPETITION_TIERS.map((tier) => ({ value: tier, label: COMPETITION_TIER_LABELS[tier] }));
export const CATEGORY_OPTIONS = COMPETITION_CATEGORIES.map((category) => ({ value: category, label: category }));

const TIER_HINT = "Tier S: Sergipano championships. A and B: other events by importance. School: school events.";

export const CLUB_SECTIONS: EntitySection[] = [
  {
    title: "Club",
    description: "Clubs and schools that players and School Games results belong to.",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      {
        name: "logoUrl",
        label: "Logo",
        kind: "image",
        mediaKind: "clubs",
        hint: "Shown next to the club in ratings and standings.",
      },
    ],
  },
];

export const LOCATION_SECTIONS: EntitySection[] = [
  {
    title: "Location",
    description: "Where players are from. Used as a filter on the ratings page.",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      {
        name: "type",
        label: "Type",
        kind: "select",
        required: true,
        options: [
          { value: "city", label: "City" },
          { value: "state", label: "State" },
          { value: "country", label: "Country" },
        ],
      },
      {
        name: "flagUrl",
        label: "Flag",
        kind: "image",
        mediaKind: "locations",
        hint: "Shown next to the location in ratings and player profiles.",
      },
    ],
  },
];

export const TITLE_SECTIONS: EntitySection[] = [
  {
    title: "Title",
    description: "FSX titles are internal; CBX and FIDE titles are external.",
    fields: [
      {
        name: "name",
        label: "Name",
        kind: "text",
        required: true,
        placeholder: "Mestre Sergipano",
      },
      {
        name: "shortName",
        label: "Abbreviation",
        kind: "text",
        required: true,
        placeholder: "MSE",
        hint: "Up to 10 characters.",
      },
      {
        name: "type",
        label: "Type",
        kind: "select",
        required: true,
        options: [
          { value: "internal", label: "Internal (FSX)" },
          { value: "external", label: "External (CBX/FIDE)" },
        ],
      },
      {
        name: "tier",
        label: "Tier",
        kind: "select",
        required: true,
        options: [
          { value: "1", label: "1 · Mestre Mirim, Mestre Júnior" },
          { value: "2", label: "2 · Mestre Feminina, Candidato a Mestre" },
          { value: "3", label: "3 · Mestre, Honoris Causa" },
          { value: "4", label: "4 · Grande Mestre" },
        ],
        hint: "Orders the title emblems on player profiles. Follows the rating each title requires.",
      },
      {
        name: "losesAtAge",
        label: "Lost at age",
        kind: "number",
        min: 1,
        max: 120,
        hint: "Youth titles only: removed automatically from 1 January of the year the player turns this age (Mestre Mirim 15, Mestre Júnior 19). Leave empty for titles that never expire.",
      },
    ],
  },
];

export const ROLE_SECTIONS: EntitySection[] = [
  {
    title: "Role",
    description: "Board, arbiter, and teacher positions shown on the members page.",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, placeholder: "Presidente" },
      {
        name: "shortName",
        label: "Abbreviation",
        kind: "text",
        required: true,
        placeholder: "PRES",
        hint: "Up to 4 characters.",
      },
      {
        name: "type",
        label: "Type",
        kind: "select",
        required: true,
        options: [
          { value: "management", label: "Board" },
          { value: "referee", label: "Arbiter" },
          { value: "teacher", label: "Teacher" },
        ],
      },
    ],
  },
];

export const NORM_SECTIONS: EntitySection[] = [
  {
    title: "Norm",
    description: "A result that counts toward a state title.",
    fields: [{ name: "name", label: "Name", kind: "text", required: true }],
  },
];

export const INSIGNIA_SECTIONS: EntitySection[] = [
  {
    title: "Insignia",
    description: "Badges awarded to players, ordered by level.",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "level", label: "Level", kind: "number", required: true, min: 1, max: 100 },
    ],
  },
];

export function circuitSections(championships: { id: number; name: string }[]): EntitySection[] {
  return [
    {
      title: "Circuit",
      description: "One season of a circuit. Create a new circuit each year instead of reusing this one.",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true, hint: "Include the year, e.g. Circuito Escolar 2026." },
        { name: "year", label: "Season", kind: "number", required: true, min: 1900, max: 2200 },
        {
          name: "type",
          label: "Layout",
          kind: "select",
          required: true,
          options: CIRCUIT_TYPES.map((type) => ({ value: type, label: CIRCUIT_TYPE_LABELS[type] })),
          hint: "By category and School layouts have a champion per category.",
        },
        { name: "tier", label: "Tier", kind: "select", required: true, options: TIER_OPTIONS, hint: TIER_HINT },
        {
          name: "championshipId",
          label: "Championship",
          kind: "select",
          hint: "Links the seasons of the same circuit, e.g. every Circuito Escolar.",
          options: championships.map((c) => ({ value: String(c.id), label: c.name })),
        },
      ],
    },
  ];
}

export const LINK_GROUP_SECTIONS: EntitySection[] = [
  {
    title: "Group",
    description: "A heading on the public /links page.",
    fields: [{ name: "label", label: "Name", kind: "text", required: true }],
  },
];

export const CHAMPIONSHIP_SECTIONS: EntitySection[] = [
  {
    title: "Championship",
    description: "A recurring competition, held every year. Its tournaments' overall podiums feed the champions gallery. One-off tournaments need no championship.",
    fields: [{ name: "name", label: "Name", kind: "text", required: true }],
  },
];

export function announcementSections(trpc: TRPC, playerLabel?: string): EntitySection[] {
  return [
    {
      title: "Numbering",
      description: "Announcements are numbered per year, e.g. 001/2026.",
      fields: [
        { name: "year", label: "Year", kind: "number", required: true, min: 1900, max: 2200 },
        { name: "number", label: "Number", kind: "number", required: true, min: 1 },
      ],
    },
    {
      title: "Content",
      description: "Markdown is supported.",
      fields: [
        { name: "content", label: "Text", kind: "textarea", required: true },
        {
          name: "playerId",
          label: "Player",
          kind: "search",
          placeholder: "Search player...",
          emptyText: "No player found.",
          initialLabel: playerLabel,
          getQueryOptions: (query) => trpc.players.search.queryOptions({ query }),
          hint: "The player this announcement is about. It is listed on their profile.",
        },
      ],
    },
  ];
}

export function tournamentSections(championships: { id: number; name: string }[]): EntitySection[] {
  return [
    {
      title: "Tournament",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "date", label: "Date", kind: "date" },
        {
          name: "ratingType",
          label: "Rating type",
          kind: "select",
          required: true,
          options: RATING_TYPE_OPTIONS,
        },
        { name: "tier", label: "Tier", kind: "select", required: true, options: TIER_OPTIONS, hint: TIER_HINT },
      ],
    },
    {
      title: "Links",
      description: "Optional context shown with the tournament.",
      fields: [
        {
          name: "championshipId",
          label: "Championship",
          kind: "select",
          hint: "Only for recurring competitions. Their overall podiums appear in the champions gallery.",
          options: championships.map((c) => ({ value: String(c.id), label: c.name })),
        },
        { name: "chessResults", label: "Chess-Results URL", kind: "url" },
      ],
    },
  ];
}

export function tournamentPodiumSections(
  trpc: TRPC,
  labels: { player?: string; tournament?: string } = {},
): EntitySection[] {
  return [
    {
      title: "Podium",
      description: "A player's final place in a tournament, overall or in one category.",
      fields: [
        {
          name: "tournamentId",
          label: "Tournament",
          kind: "search",
          required: true,
          placeholder: "Search tournament...",
          emptyText: "No tournament found.",
          initialLabel: labels.tournament,
          getQueryOptions: (query) => trpc.tournaments.search.queryOptions({ query }),
        },
        {
          name: "playerId",
          label: "Player",
          kind: "search",
          required: true,
          placeholder: "Search player...",
          emptyText: "No player found.",
          initialLabel: labels.player,
          getQueryOptions: (query) => trpc.players.search.queryOptions({ query }),
        },
        { name: "place", label: "Place", kind: "number", required: true, min: 1, max: 100000 },
        {
          name: "category",
          label: "Category",
          kind: "select",
          options: CATEGORY_OPTIONS,
          hint: "Leave empty for the overall result.",
        },
      ],
    },
  ];
}
