import { useState } from "react";
import type { LinkProps } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";

import { useTRPC } from "@/lib/trpc";

import { Input } from "@fsx/ui/components/input";

import { AdminForm, FormActions, FormSection } from "@/components/admin/form-layout";
import { DatePicker } from "@/components/form/date-picker";
import { EventLinksEditor, type EventLinkDraft } from "@/components/admin/event-links-editor";
import { SearchableSelect } from "@/components/form/searchable-select";
import { FormField } from "@/components/form/form-field";
import { fieldError } from "@/lib/errors";
import { httpUrlError, requiredText, submitThenChange, TEXT_MAX } from "@/lib/field-rules";

export interface EventValues {
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueUrl: string;
  tournamentId: string;
  tournamentName?: string;
  links: EventLinkDraft[];
}

interface EventFormProps {
  defaultValues: EventValues;
  onSubmit: (values: EventValues) => Promise<void>;
  error: unknown;
  submitLabel: string;
  cancelTo?: LinkProps["to"];
}

export function EventForm({
  defaultValues,
  onSubmit,
  error,
  submitLabel,
  cancelTo,
}: EventFormProps) {
  const trpc = useTRPC();
  const [links, setLinks] = useState(defaultValues.links);
  const [attempted, setAttempted] = useState(false);
  const linkErrors = links.map((link) => httpUrlError("URL", link.href));
  const form = useForm({
    defaultValues: {
      name: defaultValues.name,
      startDate: defaultValues.startDate,
      endDate: defaultValues.endDate,
      venue: defaultValues.venue,
      venueUrl: defaultValues.venueUrl,
      tournamentId: defaultValues.tournamentId,
    },
    validationLogic: submitThenChange,
    onSubmit: ({ value }) => {
      if (linkErrors.some(Boolean)) return;
      return onSubmit({ ...value, tournamentName: defaultValues.tournamentName, links });
    },
  });

  return (
    <AdminForm
      error={error}
      onSubmit={() => {
        setAttempted(true);
        void form.handleSubmit();
      }}
      actions={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormActions cancelTo={cancelTo} submitLabel={submitLabel} pending={isSubmitting} />
          )}
        </form.Subscribe>
      }
    >
      <FormSection
        title="Event"
        description="Events appear on the public calendar, and upcoming ones on the home page."
      >
        <form.Field
          name="name"
          validators={{ onDynamic: requiredText("Name") }}
        >
          {(f) => (
            <FormField
              label="Name"
              htmlFor="event-name"
              required
              error={fieldError(f, error)}
            >
              <Input
                id="event-name"
                maxLength={TEXT_MAX}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field
          name="startDate"
          validators={{ onDynamic: ({ value }) => (value ? undefined : "Start date is required") }}
        >
          {(f) => (
            <FormField
              label="Start date"
              htmlFor="event-start-date"
              required
              error={fieldError(f, error)}
            >
              <DatePicker
                id="event-start-date"
                value={f.state.value}
                onChange={f.handleChange}
                placeholder="Select a date"
              />
            </FormField>
          )}
        </form.Field>
        <form.Field
          name="endDate"
          validators={{
            onDynamic: ({ value, fieldApi }) =>
              value && value < fieldApi.form.getFieldValue("startDate") ? "The end date cannot be before the start date" : undefined,
          }}
        >
          {(f) => (
            <FormField
              label="End date"
              htmlFor="event-end-date"
              hint="Only for events that last more than one day."
              error={fieldError(f, error)}
            >
              <DatePicker id="event-end-date" value={f.state.value} onChange={f.handleChange} placeholder="Select a date" />
            </FormField>
          )}
        </form.Field>
        <form.Field name="venue">
          {(f) => (
            <FormField label="Venue" htmlFor="event-venue" error={fieldError(f, error)}>
              <Input
                id="event-venue"
                maxLength={120}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="venueUrl" validators={{ onDynamic: ({ value }) => httpUrlError("Venue link", value) }}>
          {(f) => (
            <FormField label="Venue link" htmlFor="event-venue-url" hint="Optional. A map or page for the venue. Without a venue name, the site shows “Ver local”." error={fieldError(f, error)}>
              <Input
                id="event-venue-url"
                type="url"
                inputMode="url"
                maxLength={2048}
                placeholder="https://maps.google.com/…"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="tournamentId">
          {(f) => (
            <FormField
              label="Tournament"
              htmlFor="event-tournament"
              hint="Optional. Links the calendar entry to the tournament page once it exists."
              error={fieldError(f, error)}
            >
              <SearchableSelect
                id="event-tournament"
                value={f.state.value}
                onChange={f.handleChange}
                initialLabel={defaultValues.tournamentName}
                getQueryOptions={(query) => trpc.tournaments.search.queryOptions({ query })}
                placeholder="Search a tournament..."
                emptyText="No tournament found."
              />
            </FormField>
          )}
        </form.Field>
      </FormSection>
      <FormSection
        title="Links"
        description="Buttons shown with the event. A link without a URL appears as “coming soon”."
      >
        <EventLinksEditor value={links} onChange={setLinks} errors={attempted ? linkErrors : []} />
      </FormSection>
    </AdminForm>
  );
}
