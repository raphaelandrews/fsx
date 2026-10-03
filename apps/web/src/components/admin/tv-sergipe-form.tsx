import type { LinkProps } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";

import { NATIVE_SELECT_CLASS } from "@/components/admin/entity-form";
import { AdminForm, FormActions, FormSection } from "@/components/admin/form-layout";
import { FormField } from "@/components/form/form-field";
import { SearchableSelect } from "@/components/searchable-select";
import { fieldError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";
import {
  AGE_GROUPS,
  MODALITY_OPTIONS,
  PLACE_POINTS,
  SEX_OPTIONS,
  TEAM_NAMES,
} from "@/routes/_auth/dashboard/tv-sergipe/-constants";

export interface TvSergipeValues {
  clubId: string;
  modality: "individual" | "team";
  playerId: string;
  teamName: string;
  ageGroup: string;
  sex: "male" | "female";
  place: string;
}

interface TvSergipeFormProps {
  defaultValues: TvSergipeValues;
  labels?: { club?: string; player?: string };
  onSubmit: (values: TvSergipeValues) => void;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  cancelTo: LinkProps["to"];
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
  const form = useForm({ defaultValues, onSubmit: ({ value }) => onSubmit(value) });

  return (
    <AdminForm
      onSubmit={() => form.handleSubmit()}
      actions={<FormActions cancelTo={cancelTo} submitLabel={submitLabel} pending={pending} />}
    >
      <FormSection
        title="Participant"
        description="A school's individual player or one of its teams."
      >
        <form.Field
          name="clubId"
          validators={{ onSubmit: ({ value }) => (value ? undefined : "School is required") }}
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
                  onSubmit: ({ value, fieldApi }) =>
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
        description="Points follow the place: 10, 8, 6, 5, 4, 3, 2, 1. Team places count as two medals."
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
                {Object.entries(PLACE_POINTS).map(([place, points]) => (
                  <option key={place} value={place}>
                    {place}º · {points} points
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
      </FormSection>
    </AdminForm>
  );
}

export function toTvSergipeInput(values: TvSergipeValues) {
  return {
    clubId: Number(values.clubId),
    playerId: values.modality === "individual" ? Number(values.playerId) : null,
    teamName: values.modality === "team" ? (values.teamName as (typeof TEAM_NAMES)[number]) : null,
    ageGroup: values.ageGroup as (typeof AGE_GROUPS)[number],
    sex: values.sex,
    modality: values.modality,
    place: Number(values.place),
  };
}
