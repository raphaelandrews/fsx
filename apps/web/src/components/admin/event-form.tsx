import { useState } from "react";
import type { LinkProps } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";

import { Input } from "@fsx/ui/components/input";

import { AdminForm, FormActions, FormSection } from "@/components/admin/form-layout";
import { DatePicker } from "@/components/date-picker";
import { EventLinksEditor, type EventLinkDraft } from "@/components/event-links-editor";
import { FormField } from "@/components/form/form-field";
import { fieldError } from "@/lib/errors";

export interface EventValues {
  name: string;
  startDate: string;
  links: EventLinkDraft[];
}

interface EventFormProps {
  defaultValues: EventValues;
  onSubmit: (values: EventValues) => Promise<void>;
  error: unknown;
  submitLabel: string;
  cancelTo: LinkProps["to"];
}

export function EventForm({
  defaultValues,
  onSubmit,
  error,
  submitLabel,
  cancelTo,
}: EventFormProps) {
  const [links, setLinks] = useState(defaultValues.links);
  const form = useForm({
    defaultValues: { name: defaultValues.name, startDate: defaultValues.startDate },
    onSubmit: ({ value }) => onSubmit({ ...value, links }),
  });

  return (
    <AdminForm
      onSubmit={() => form.handleSubmit()}
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
        description="Upcoming events are listed on the home page by start date."
      >
        <form.Field
          name="name"
          validators={{ onSubmit: ({ value }) => (value.trim() ? undefined : "Name is required") }}
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
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field
          name="startDate"
          validators={{ onSubmit: ({ value }) => (value ? undefined : "Start date is required") }}
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
      </FormSection>
      <FormSection
        title="Links"
        description="Buttons shown with the event. A link without a URL appears as “coming soon”."
      >
        <EventLinksEditor value={links} onChange={setLinks} />
      </FormSection>
    </AdminForm>
  );
}
