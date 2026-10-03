import { CIRCUIT_TYPE_LABELS, CIRCUIT_TYPES } from "@fsx/api/circuit-types";

import type { EntitySection } from "@/components/admin/entity-form";
import type { useTRPC } from "@/utils/trpc";

type TRPC = ReturnType<typeof useTRPC>;

const RATING_TYPE_OPTIONS = [
  { value: "classic", label: "Classic" },
  { value: "rapid", label: "Rapid" },
  { value: "blitz", label: "Blitz" },
] as const;

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

export const CIRCUIT_SECTIONS: EntitySection[] = [
  {
    title: "Circuit",
    description: "The type sets how the public circuits page lays out the ranking.",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      {
        name: "type",
        label: "Layout",
        kind: "select",
        required: true,
        options: CIRCUIT_TYPES.map((type) => ({ value: type, label: CIRCUIT_TYPE_LABELS[type] })),
        hint: "Overall circuits have no stages: their podiums are the final ranking.",
      },
    ],
  },
];

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
    description: "A recurring competition. Its tournaments' podiums feed the champions gallery.",
    fields: [{ name: "name", label: "Name", kind: "text", required: true }],
  },
];

export const ANNOUNCEMENT_SECTIONS: EntitySection[] = [
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
    fields: [{ name: "content", label: "Text", kind: "textarea", required: true }],
  },
];

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
          hint: "Podiums of championship tournaments appear in the champions gallery.",
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
      description: "A player's final place in a tournament.",
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
      ],
    },
  ];
}
