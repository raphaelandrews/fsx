import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";
import { RATING_TYPES, RATING_LABELS_PT } from "@fsx/api/rating-types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fsx/ui/components/table";
import { cn } from "@fsx/ui/lib/utils";

type Comparison = inferRouterOutputs<AppRouter>["players"]["compare"];

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

type Row = { label: string; a: number | null; b: number | null };

function rowsOf([a, b]: Comparison["players"]): Row[] {
  return [
    ...RATING_TYPES.map((type) => ({ label: `Rating ${RATING_LABELS_PT[type]}`, a: a.ratings[type], b: b.ratings[type] })),
    ...RATING_TYPES.map((type) => ({ label: `Melhor rating ${RATING_LABELS_PT[type]}`, a: a.formats[type]?.peak ?? null, b: b.formats[type]?.peak ?? null })),
    { label: "Nível", a: a.level, b: b.level },
    { label: "Torneios disputados", a: a.tournamentsPlayed, b: b.tournamentsPlayed },
    { label: "Ouros", a: a.medals.gold, b: b.medals.gold },
    { label: "Pratas", a: a.medals.silver, b: b.medals.silver },
    { label: "Bronzes", a: a.medals.bronze, b: b.medals.bronze },
  ];
}

function Value({ value, better }: { value: number | null; better: boolean }) {
  return (
    <span className={cn("tabular-nums", better ? "font-semibold text-success" : "text-muted-foreground")}>
      {value ?? "—"}
      {better ? <span className="sr-only"> (maior)</span> : null}
    </span>
  );
}

export function CompareStats({ players }: { players: Comparison["players"] }) {
  const [a, b] = players;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">
            <span className="sr-only">Estatística</span>
          </TableHead>
          {players.map((player) => (
            <TableHead key={player.id} className="text-center">
              <Link to="/jogadores/$id" params={{ id: player.id }} className="link-inline">
                {player.nickname || player.name}
              </Link>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowsOf([a, b]).map((row) => (
          <TableRow key={row.label}>
            <TableCell className="text-muted-foreground">{row.label}</TableCell>
            <TableCell className="text-center">
              <Value value={row.a} better={row.a !== null && row.a > (row.b ?? -1)} />
            </TableCell>
            <TableCell className="text-center">
              <Value value={row.b} better={row.b !== null && row.b > (row.a ?? -1)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Variation({ value }: { value: number }) {
  return <span className={cn("font-semibold tabular-nums", value >= 0 ? "text-success" : "text-destructive")}>{signed(value)}</span>;
}

export function CommonTournaments({ comparison }: { comparison: Comparison }) {
  const [a, b] = comparison.players;
  if (comparison.common.length === 0) {
    return <p className="py-6 text-center text-muted-foreground text-sm">Os dois ainda não jogaram o mesmo torneio.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Torneio</TableHead>
          <TableHead>Ritmo</TableHead>
          <TableHead className="text-center">{a.nickname || a.name}</TableHead>
          <TableHead className="text-center">{b.nickname || b.name}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comparison.common.map((row) => (
          <TableRow key={row.tournamentId}>
            <TableCell>
              <Link to="/torneios/$id" params={{ id: row.tournamentId }} className="link-inline font-medium">
                {row.name}
              </Link>
              {row.date ? <span className="block text-muted-foreground text-xs">{row.date.split("-").reverse().join("/")}</span> : null}
            </TableCell>
            <TableCell className="text-muted-foreground">{RATING_LABELS_PT[row.ratingType]}</TableCell>
            <TableCell className="text-center">
              <Variation value={row.a.variation} />
            </TableCell>
            <TableCell className="text-center">
              <Variation value={row.b.variation} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
