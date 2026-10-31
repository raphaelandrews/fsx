import type { LinkProps } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";

import { Input } from "@fsx/ui/components/input";

import { NATIVE_SELECT_CLASS } from "@/components/admin/entity-form";
import { AdminForm, FormActions, FormSection } from "@/components/admin/form-layout";
import { FormField } from "@/components/form/form-field";
import { SearchableSelect } from "@/components/form/searchable-select";
import { fieldError } from "@/lib/errors";
import { submitThenChange } from "@/lib/field-rules";
import { useTRPC } from "@/lib/trpc";
import {
  AGE_GROUPS,
  MODALITY_OPTIONS,
  PLACE_POINTS,
  SEX_OPTIONS,
  TEAM_NAMES,
} from "@/routes/_auth/dashboard/tv-sergipe/-constants";

export interface TvSergipeValues {
  tournamentId: string;
  clubId: string;
  modality: "individual" | "team";
  playerId: string;
  teamName: string;
  ageGroup: string;
  sex: "male" | "female";
  place: string;
  points: string;
}

interface TvSergipeFormProps {
  defaultValues: TvSergipeValues;
  labels?: { tournament?: string; club?: string; player?: string };
  onSubmit: (values: TvSergipeValues) => void;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  cancelTo?: LinkProps["to"];
}

export function TvSergipeForm({
  defaultValues,
  labels = {},
  onSubmit,
  error,
  pending,
  submitLabel,
  cancelTo,
}: TvSergipeFormProps) {
  const trpc = useTRPC();
  const form = useForm({
    defaultValues,
    validationLogic: submitThenChange,
    onSubmit: ({ value }) => onSubmit(value),
  });

  const dirty = useStore(form.store, (state) => state.isDirty);

  return (
    <AdminForm
      dirty={dirty}
      error={error}
      onSubmit={() => form.handleSubmit()}
      actions={<FormActions cancelTo={cancelTo} submitLabel={submitLabel} pending={pending} />}
    >
      <FormSection title="Edition" description="The tournament this result belongs to, such as TV Sergipe 2027.">
        <form.Field
          name="tournamentId"
          validators={{ onDynamic: ({ value }) => (value ? undefined : "Tournament is required") }}
        >
          {(f) => (
            <FormField label="Tournament" htmlFor="tv-tournamentId" required error={fieldError(f, error)}>
              <SearchableSelect
                id="tv-tournamentId"
                value={f.state.value}
                onChange={f.handleChange}
                getQueryOptions={(query) => trpc.tournaments.search.queryOptions({ query })}
                placeholder="Search tournament..."
                emptyText="No tournament found."
                initialLabel={labels.tournament}
              />
            </FormField>
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title="Participant"
        description="A school's individual player or one of its teams."
      >
        <form.Field
          name="clubId"
          validators={{ onDynamic: ({ value }) => (value ? undefined : "School is required") }}
        >
          {(f) => (
            <FormField
              label="School"
              htmlFor="tv-clubId"
              required
              error={fieldError(f, error)}
            >
              <SearchableSelect
                id="tv-clubId"
                value={f.state.value}
                onChange={f.handleChange}
                getQueryOptions={(query) => trpc.clubs.search.queryOptions({ query })}
                placeholder="Search school..."
                emptyText="No school found."
                initialLabel={labels.club}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="modality">
          {(f) => (
            <FormField
              label="Modality"
              htmlFor="tv-modality"
              required
              error={fieldError(f, error)}
            >
              <select
                id="tv-modality"
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value as TvSergipeValues["modality"])}
                className={NATIVE_SELECT_CLASS}
              >
                {MODALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.modality}>
          {(modality) =>
            modality === "individual" ? (
              <form.Field
                name="playerId"
                validators={{
                  onDynamic: ({ value, fieldApi }) =>
                    fieldApi.form.getFieldValue("modality") === "individual" && !value
                      ? "Player is required"
                      : undefined,
                }}
              >
                {(f) => (
                  <FormField
                    label="Player"
                    htmlFor="tv-playerId"
                    required
                    error={fieldError(f, error)}
                  >
                    <SearchableSelect
                      id="tv-playerId"
                      value={f.state.value}
                      onChange={f.handleChange}
                      getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
                      showId
                      placeholder="Search player..."
                      emptyText="No player found."
                      initialLabel={labels.player}
                    />
                  </FormField>
                )}
              </form.Field>
            ) : (
              <form.Field name="teamName">
                {(f) => (
                  <FormField
                    label="Team"
                    htmlFor="tv-teamName"
                    required
                    hint="Tells apart several teams from the same school."
                    error={fieldError(f, error)}
                  >
                    <select
                      id="tv-teamName"
                      value={f.state.value}
                      onChange={(e) => f.handleChange(e.target.value)}
                      className={NATIVE_SELECT_CLASS}
                    >
                      {TEAM_NAMES.map((name) => (
                        <option key={name} value={name}>
                          Team {name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
              </form.Field>
            )
          }
        </form.Subscribe>
      </FormSection>

      <FormSection title="Category">
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="ageGroup">
            {(f) => (
              <FormField
                label="Age group"
                htmlFor="tv-ageGroup"
                required
                error={fieldError(f, error)}
              >
                <select
                  id="tv-ageGroup"
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                  className={NATIVE_SELECT_CLASS}
                >
                  {AGE_GROUPS.map((age) => (
                    <option key={age} value={age}>
                      Under {age}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </form.Field>
          <form.Field name="sex">
            {(f) => (
              <FormField
                label="Sex"
                htmlFor="tv-sex"
                required
                error={fieldError(f, error)}
              >
                <select
                  id="tv-sex"
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value as TvSergipeValues["sex"])}
                  className={NATIVE_SELECT_CLASS}
                >
                  {SEX_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </form.Field>
        </div>
      </FormSection>

      <FormSection
        title="Placement"
        description="Team places count as two medals. Individual places 1–3 also become tournament podiums."
      >
        <form.Field name="place">
          {(f) => (
            <FormField
              label="Place"
              htmlFor="tv-place"
              required
              error={fieldError(f, error)}
            >
              <select
                id="tv-place"
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
                className={NATIVE_SELECT_CLASS}
              >
                {Object.keys(PLACE_POINTS).map((place) => (
                  <option key={place} value={place}>
                    {place}º
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
        <form.Field name="points">
          {(f) => (
            <FormField
              label="Points"
              htmlFor="tv-points"
              hint="Leave empty to use the edition's scoring scheme (set on the tournament)."
              error={fieldError(f, error)}
            >
              <Input
                id="tv-points"
                type="number"
                min={0}
                max={1000}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
      </FormSection>
    </AdminForm>
  );
}

export function toTvSergipeInput(values: TvSergipeValues) {
  return {
    tournamentId: Number(values.tournamentId),
    clubId: Number(values.clubId),
    playerId: values.modality === "individual" ? Number(values.playerId) : null,
    teamName: values.modality === "team" ? (values.teamName as (typeof TEAM_NAMES)[number]) : null,
    ageGroup: values.ageGroup as (typeof AGE_GROUPS)[number],
    sex: values.sex,
    modality: values.modality,
    place: Number(values.place),
    points: values.points === "" ? undefined : Number(values.points),
  };
}
