import { COMPETITION_TIERS } from "@fsx/api/circuit-types";
import { RATING_TYPES } from "@fsx/api/rating-types";
import { Button } from "@fsx/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fsx/ui/components/select";

import { hasFilters, RHYTHM_LABELS, TIER_LABELS, type TournamentSearch } from "./labels";

const ALL = "all";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const labelOf = (current: string | undefined) => options.find((option) => option.value === current)?.label ?? "Todos";
  return (
    <Select value={value ?? ALL} onValueChange={(next) => next && onChange(next === ALL ? undefined : next)}>
      <SelectTrigger className="h-8 min-w-36 text-sm" aria-label={label}>
        <SelectValue>{(current) => `${label}: ${labelOf(current === ALL ? undefined : (current as string))}`}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TournamentFilters({
  search,
  years,
  championships,
  onChange,
  onClear,
}: {
  search: TournamentSearch;
  years: number[];
  championships: { id: number; name: string }[];
  onChange: (patch: Partial<Omit<TournamentSearch, "page">>) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
      <FilterSelect
        label="Ano"
        value={search.ano === undefined ? undefined : String(search.ano)}
        options={years.map((year) => ({ value: String(year), label: String(year) }))}
        onChange={(value) => onChange({ ano: value === undefined ? undefined : Number(value) })}
      />
      <FilterSelect
        label="Nível"
        value={search.nivel}
        options={COMPETITION_TIERS.map((tier) => ({ value: tier, label: TIER_LABELS[tier] }))}
        onChange={(value) => onChange({ nivel: value as TournamentSearch["nivel"] })}
      />
      <FilterSelect
        label="Ritmo"
        value={search.ritmo}
        options={RATING_TYPES.map((type) => ({ value: type, label: RHYTHM_LABELS[type] }))}
        onChange={(value) => onChange({ ritmo: value as TournamentSearch["ritmo"] })}
      />
      {championships.length > 0 ? (
        <FilterSelect
          label="Campeonato"
          value={search.campeonato === undefined ? undefined : String(search.campeonato)}
          options={championships.map((championship) => ({ value: String(championship.id), label: championship.name }))}
          onChange={(value) => onChange({ campeonato: value === undefined ? undefined : Number(value) })}
        />
      ) : null}
      {hasFilters(search) ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
