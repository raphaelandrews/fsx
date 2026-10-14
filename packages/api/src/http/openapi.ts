import { PUBLIC_API_HEADERS, PUBLIC_API_TTL_SECONDS } from "./public-api-contract";

// The contract of /api/v1: served at /api/v1/openapi.json and rendered by the
// docs site (fumadocs-openapi). public-api.integration.test.ts checks real
// responses against these schemas, so a drifting handler fails CI.

const MINUTES = PUBLIC_API_TTL_SECONDS / 60;

const t = {
  title: "FSX Public API",
  intro: [
    "Open data from the Federação Sergipana de Xadrez: IDs, names, and ratings of active players.",
    "",
    "- **No key and no cookies.** Works from any website's browser (CORS `*`) or from a server.",
    `- **Cached for ${MINUTES} minutes.** A change can take that long to appear; \`updatedAt\` tells when the response was generated.`,
    "- **Rate limited.** Requests that miss the cache count toward a per-IP limit (600 per minute). Over it, the response is `429` with `Retry-After`.",
    "- **Stable.** Existing fields keep their names, types, and meaning; new fields may be added. Breaking changes ship as `/api/v2`.",
    "",
    'When you publish the data, credit the source: "Fonte: Federação Sergipana de Xadrez (fsx.org.br)".',
  ],
  thisSite: "This site",
  tag: ["Players", "Active players and their ratings."],
  list: {
    summary: "List players",
    description:
      "Every active player (the same ones as `/ratings`), ordered by `id`, in a single response. There are no parameters: filter and sort on your side.",
    ok: "Active players.",
  },
  get: {
    summary: "Get a player by ID",
    description:
      "One active player, with ratings, birth year, club, and titles. The `id` is the same as in the list and in the profile page (`/jogadores/{id}`). For many players, use the list: one request is cheaper than many.",
    idParam: "Numeric player ID, without leading zeros.",
    ok: "The player.",
    notFound: `Unknown ID, inactive player, or malformed ID. Also cached for ${MINUTES} minutes.`,
  },
  fields: {
    id: "Permanent player ID.",
    name: "Full name.",
    classic: "Classical rating.",
    rapid: "Rapid rating.",
    blitz: "Blitz rating.",
    birthYear: "Birth year, or `null` when unknown. The full date is not published.",
    club: "The player's club, or `null`.",
    clubId: "Club ID.",
    clubName: "Club name.",
    titles: "Titles, FSX titles first. Empty when the player has none.",
    titleName: "Title name.",
    titleShortName: "Abbreviation, for example `MF`.",
    titleType: "`internal`: an FSX title. `external`: a CBX or FIDE title.",
    updatedAt: "When the response was generated (UTC).",
    count: "Number of players in `players`.",
  },
  cacheHeader: `Responses are cached for ${PUBLIC_API_TTL_SECONDS} seconds.`,
  corsHeader: "Any website can read the response from the browser.",
  tooMany: "Rate limit exceeded.",
  retryAfter: "Seconds before retrying.",
} as const;

const PLAYER_EXAMPLE = { id: 1, name: "Andrews Souza", classic: 2150, rapid: 2100, blitz: 2050 };

function createOpenApiDocument() {
  const cachedHeaders = {
    "Cache-Control": { $ref: "#/components/headers/CacheControl" },
    "Access-Control-Allow-Origin": { $ref: "#/components/headers/AllowOrigin" },
  };
  const ratingFields = {
    id: { type: "integer", minimum: 1, description: t.fields.id },
    name: { type: "string", description: t.fields.name },
    classic: { type: "integer", description: t.fields.classic },
    rapid: { type: "integer", description: t.fields.rapid },
    blitz: { type: "integer", description: t.fields.blitz },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: t.title,
      version: "1.1.0",
      description: t.intro.join("\n"),
      contact: { name: "Federação Sergipana de Xadrez", url: "https://www.fsx.org.br/sobre" },
    },
    // Relative, so imported clients call the server that served the spec.
    servers: [{ url: "/", description: t.thisSite }],
    // No authentication: every operation is public.
    security: [],
    tags: [{ name: t.tag[0], description: t.tag[1] }],
    paths: {
      "/api/v1/players": {
        get: {
          operationId: "listPlayers",
          tags: [t.tag[0]],
          summary: t.list.summary,
          description: t.list.description,
          responses: {
            "200": {
              description: t.list.ok,
              headers: cachedHeaders,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PlayerList" },
                  example: {
                    updatedAt: "2026-10-03T13:55:28.519Z",
                    count: 2,
                    players: [PLAYER_EXAMPLE, { id: 2, name: "Maria Silva", classic: 1900, rapid: 1850, blitz: 1800 }],
                  },
                },
              },
            },
            "429": { $ref: "#/components/responses/TooManyRequests" },
          },
        },
      },
      "/api/v1/players/{id}": {
        get: {
          operationId: "getPlayer",
          tags: [t.tag[0]],
          summary: t.get.summary,
          description: t.get.description,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: t.get.idParam,
              schema: { type: "integer", minimum: 1, maximum: 9_999_999_999 },
              example: 1,
            },
          ],
          responses: {
            "200": {
              description: t.get.ok,
              headers: cachedHeaders,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PlayerResponse" },
                  example: {
                    updatedAt: "2026-10-03T14:03:29.008Z",
                    player: {
                      ...PLAYER_EXAMPLE,
                      birthYear: 1995,
                      club: { id: 1, name: "Clube de Xadrez de Aracaju" },
                      titles: [
                        { name: "Mestre Sergipano", shortName: "MSE", type: "internal" },
                        { name: "Mestre FIDE", shortName: "MF", type: "external" },
                      ],
                    },
                  },
                },
              },
            },
            "404": {
              description: t.get.notFound,
              headers: { "Access-Control-Allow-Origin": { $ref: "#/components/headers/AllowOrigin" } },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                  example: { error: "Player not found" },
                },
              },
            },
            "429": { $ref: "#/components/responses/TooManyRequests" },
          },
        },
      },
    },
    components: {
      schemas: {
        Player: {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "classic", "rapid", "blitz"],
          properties: ratingFields,
        },
        PlayerDetail: {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "classic", "rapid", "blitz", "birthYear", "club", "titles"],
          properties: {
            ...ratingFields,
            birthYear: { type: ["integer", "null"], description: t.fields.birthYear, example: 1995 },
            club: {
              type: ["object", "null"],
              description: t.fields.club,
              additionalProperties: false,
              required: ["id", "name"],
              properties: {
                id: { type: "integer", minimum: 1, description: t.fields.clubId },
                name: { type: "string", description: t.fields.clubName },
              },
            },
            titles: {
              type: "array",
              description: t.fields.titles,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "shortName", "type"],
                properties: {
                  name: { type: "string", description: t.fields.titleName },
                  shortName: { type: "string", description: t.fields.titleShortName },
                  type: { type: "string", enum: ["internal", "external"], description: t.fields.titleType },
                },
              },
            },
          },
        },
        PlayerList: {
          type: "object",
          required: ["updatedAt", "count", "players"],
          properties: {
            updatedAt: { type: "string", format: "date-time", description: t.fields.updatedAt },
            count: { type: "integer", minimum: 0, description: t.fields.count },
            players: { type: "array", items: { $ref: "#/components/schemas/Player" } },
          },
        },
        PlayerResponse: {
          type: "object",
          required: ["updatedAt", "player"],
          properties: {
            updatedAt: { type: "string", format: "date-time", description: t.fields.updatedAt },
            player: { $ref: "#/components/schemas/PlayerDetail" },
          },
        },
        Error: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "string" } },
        },
      },
      headers: {
        CacheControl: {
          description: t.cacheHeader,
          schema: { type: "string", example: `public, max-age=${PUBLIC_API_TTL_SECONDS}` },
        },
        AllowOrigin: {
          description: t.corsHeader,
          schema: { type: "string", const: "*" },
        },
      },
      responses: {
        TooManyRequests: {
          description: t.tooMany,
          headers: {
            "Retry-After": { description: t.retryAfter, schema: { type: "integer", example: 60 } },
            "Access-Control-Allow-Origin": { $ref: "#/components/headers/AllowOrigin" },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Too many requests, please try again later." },
            },
          },
        },
      },
    },
  } as const;
}

export const OPENAPI_DOCUMENT = createOpenApiDocument();

const OPENAPI_BODY = JSON.stringify(OPENAPI_DOCUMENT);

// Static, so it needs neither D1 nor the rate limit.
export function handleOpenApiRequest(request: Request): Response {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: PUBLIC_API_HEADERS });
  }
  return new Response(OPENAPI_BODY, {
    headers: {
      ...PUBLIC_API_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${PUBLIC_API_TTL_SECONDS}`,
    },
  });
}
