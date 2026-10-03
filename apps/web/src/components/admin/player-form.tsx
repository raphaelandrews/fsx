import type { MutableRefObject } from "react";
import type { LinkProps } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";

import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { NATIVE_SELECT_CLASS } from "@/components/admin/entity-form";
import { AdminForm, FormActions, FormSection } from "@/components/admin/form-layout";
import { DatePicker } from "@/components/date-picker";
import { FormField } from "@/components/form/form-field";
import { ImageUpload } from "@/components/image-upload";
import { SearchableSelect } from "@/components/searchable-select";
import { fieldError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export type RatingType = "classic" | "rapid" | "blitz";
const RATING_TYPES: RatingType[] = ["classic", "rapid", "blitz"];

export interface PlayerValues {
  name: string;
  nickname: string;
  birthDate: string;
  sex: "male" | "female";
  imageUrl: string;
  clubId: number | null;
  locationId: number | null;
  classic: number;
  rapid: number;
  blitz: number;
  cbxId: number | null;
  fideId: number | null;
  active: boolean;
  verified: boolean;
}

interface PlayerFormProps {
  defaultValues: PlayerValues;
  /** `editedRatings` lists the ratings the admin changed in this form. */
  onSubmit: (values: PlayerValues, editedRatings: RatingType[]) => void;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  cancelTo: LinkProps["to"];
  locations: { id: number; name: string }[];
  clubName?: string;
  ratingsHint?: string;
  onImageReplaced: (url: string) => void;
  onImageUploaded: (url: string) => void;
  /** Lets the page update a rating after a rating-history correction without marking it edited. */
  setRatingRef?: MutableRefObject<((ratingType: RatingType, rating: number) => void) | null>;
}

const RATING_LABELS: Record<RatingType, string> = {
  classic: "Classic",
  rapid: "Rapid",
  blitz: "Blitz",
};

export function PlayerForm({
  defaultValues,
  onSubmit,
  error,
  pending,
  submitLabel,
  cancelTo,
  locations,
  clubName,
  ratingsHint,
  onImageReplaced,
  onImageUploaded,
  setRatingRef,
}: PlayerFormProps) {
  const trpc = useTRPC();
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) =>
      onSubmit(
        value,
        RATING_TYPES.filter((ratingType) => form.getFieldMeta(ratingType)?.isDirty),
      ),
  });
  if (setRatingRef) {
    setRatingRef.current = (ratingType, rating) =>
      form.setFieldValue(ratingType, rating, { dontUpdateMeta: true });
  }

  const numberInput = (field: "cbxId" | "fideId", label: string) => (
    <form.Field name={field}>
      {(f) => (
        <FormField
          label={label}
          htmlFor={`player-${field}`}
          error={fieldError(f, error)}
        >
          <Input
            id={`player-${field}`}
            type="number"
            inputMode="numeric"
            value={f.state.value?.toString() ?? ""}
            onBlur={f.handleBlur}
            onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)}
          />
        </FormField>
      )}
    </form.Field>
  );

  const checkbox = (field: "active" | "verified", label: string, hint: string) => (
    <form.Field name={field}>
      {(f) => (
        <div className="flex items-start gap-3">
          <input
            id={`player-${field}`}
            type="checkbox"
            checked={f.state.value}
            onChange={(e) => f.handleChange(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-primary"
            aria-describedby={`player-${field}-hint`}
          />
          <div>
            <Label htmlFor={`player-${field}`}>{label}</Label>
            <p id={`player-${field}-hint`} className="text-muted-foreground text-xs">
              {hint}
            </p>
          </div>
        </div>
      )}
    </form.Field>
  );

  return (
    <AdminForm
      onSubmit={() => form.handleSubmit()}
      actions={<FormActions cancelTo={cancelTo} submitLabel={submitLabel} pending={pending} />}
    >
      <FormSection
        title="Identity"
        description="Birth date and sex are private; they drive the age-group and category filters."
      >
        <form.Field
          name="name"
          validators={{ onSubmit: ({ value }) => (value.trim() ? undefined : "Name is required") }}
        >
          {(f) => (
            <FormField
              label="Name"
              htmlFor="player-name"
              required
              error={fieldError(f, error)}
            >
              <Input
                id="player-name"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="nickname">
          {(f) => (
            <FormField
              label="Nickname"
              htmlFor="player-nickname"
              hint="Shown instead of the name when set."
              error={fieldError(f, error)}
            >
              <Input
                id="player-nickname"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="birthDate">
            {(f) => (
              <FormField
                label="Birth date"
                htmlFor="player-birthDate"
                error={fieldError(f, error)}
              >
                <DatePicker
                  id="player-birthDate"
                  value={f.state.value}
                  onChange={f.handleChange}
                  placeholder="Select a date"
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="sex">
            {(f) => (
              <FormField
                label="Sex"
                htmlFor="player-sex"
                required
                error={fieldError(f, error)}
              >
                <select
                  id="player-sex"
                  value={f.state.value}
                  onBlur={f.handleBlur}
                  onChange={(e) => f.handleChange(e.target.value as "male" | "female")}
                  className={NATIVE_SELECT_CLASS}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </FormField>
            )}
          </form.Field>
        </div>
      </FormSection>

      <FormSection title="Photo" description="Cropped to a square.">
        <form.Field name="imageUrl">
          {(f) => (
            <ImageUpload
              kind="players"
              value={f.state.value || null}
              onChange={(url) => f.handleChange(url ?? "")}
              onImageReplaced={onImageReplaced}
              onUploaded={onImageUploaded}
            />
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title="Affiliation"
        description="Club and location appear on the profile and filter the ratings page."
      >
        <form.Field name="clubId">
          {(f) => (
            <FormField
              label="Club"
              htmlFor="player-clubId"
              error={fieldError(f, error)}
            >
              <SearchableSelect
                id="player-clubId"
                value={f.state.value?.toString() ?? ""}
                onChange={(value) => f.handleChange(value ? Number(value) : null)}
                getQueryOptions={(query) => trpc.clubs.search.queryOptions({ query })}
                placeholder="Search club..."
                emptyText="No club found."
                initialLabel={clubName}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="locationId">
          {(f) => (
            <FormField
              label="Location"
              htmlFor="player-locationId"
              error={fieldError(f, error)}
            >
              <select
                id="player-locationId"
                value={f.state.value?.toString() ?? ""}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)}
                className={NATIVE_SELECT_CLASS}
              >
                <option value="">None</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
      </FormSection>

      <FormSection title="Ratings" description={ratingsHint ?? "Starting FSX ratings, 0–4000."}>
        <div className="grid gap-4 sm:grid-cols-3">
          {RATING_TYPES.map((ratingType) => (
            <form.Field
              key={ratingType}
              name={ratingType}
              validators={{
                onSubmit: ({ value }) =>
                  Number.isInteger(value) && value >= 0 && value <= 4000
                    ? undefined
                    : "Use a whole number from 0 to 4000",
              }}
            >
              {(f) => (
                <FormField
                  label={RATING_LABELS[ratingType]}
                  htmlFor={`player-${ratingType}`}
                  required
                  error={fieldError(f, error)}
                >
                  <Input
                    id={`player-${ratingType}`}
                    type="number"
                    inputMode="numeric"
                    value={String(f.state.value)}
                    onBlur={f.handleBlur}
                    onChange={(e) => f.handleChange(Number(e.target.value))}
                  />
                </FormField>
              )}
            </form.Field>
          ))}
        </div>
      </FormSection>

      <FormSection title="Federation IDs" description="Link to the player's CBX and FIDE profiles.">
        <div className="grid gap-4 sm:grid-cols-2">
          {numberInput("cbxId", "CBX ID")}
          {numberInput("fideId", "FIDE ID")}
        </div>
      </FormSection>

      <FormSection title="Status">
        {checkbox(
          "active",
          "Active",
          "Active players appear in the ratings and the top-player lists.",
        )}
        {checkbox("verified", "Verified", "Shows a verified badge on the profile.")}
      </FormSection>
    </AdminForm>
  );
}
