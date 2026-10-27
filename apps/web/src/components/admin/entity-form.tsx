import type { ComponentProps, ReactNode } from "react";
import type { LinkProps } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";

import type { MediaKind } from "@fsx/api/media-kinds";
import { Button } from "@fsx/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fsx/ui/components/dialog";
import { Input } from "@fsx/ui/components/input";
import { Textarea } from "@fsx/ui/components/textarea";

import { AdminForm, FormActions, FormAsideCard, FormErrorSummary, FormSection } from "@/components/admin/form-layout";
import { DatePicker } from "@/components/form/date-picker";
import { FormField } from "@/components/form/form-field";
import { ImageUpload } from "@/components/media/image-upload";
import { SearchableSelect } from "@/components/form/searchable-select";
import { fieldError } from "@/lib/errors";
import { maxLengthOf, validateField } from "@/lib/entity-validation";
import { submitThenChange } from "@/lib/field-rules";

export const NATIVE_SELECT_CLASS =
  "h-12 w-full rounded-xl border border-input bg-background px-3 text-base transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

type BaseField = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Longest accepted text; defaults to the API limit for the field kind. */
  maxLength?: number;
};

export type EntityField = BaseField &
  (
    | { kind: "text" | "url" | "textarea" | "date" }
    | { kind: "number"; min?: number; max?: number }
    | { kind: "select"; options: readonly { value: string; label: string }[] }
    | { kind: "image"; mediaKind: MediaKind }
    | {
        kind: "search";
        getQueryOptions: ComponentProps<typeof SearchableSelect>["getQueryOptions"];
        initialLabel?: string;
        emptyText?: string;
      }
    | {
        kind: "custom";
        render: (control: {
          id: string;
          value: string;
          onChange: (value: string) => void;
        }) => ReactNode;
      }
  );

export type EntitySection = { title: string; description?: string; fields: EntityField[] };

type Values = Record<string, string>;

/** R2 lifecycle callbacks from `usePendingImageDeletes`, for `image` fields. */
export type ImageTracking = {
  onImageReplaced: (url: string) => void;
  onImageUploaded: (url: string) => void;
};

interface EntityFormProps {
  sections: EntitySection[];
  defaultValues: Values;
  onSubmit: (values: Values) => void;
  /** The mutation error, so server validation shows next to its field. */
  error: unknown;
  pending: boolean;
  submitLabel: string;
  cancelTo: LinkProps["to"];
  images?: ImageTracking;
}

function useValuesForm(defaultValues: Values, onSubmit: (values: Values) => void) {
  return useForm({
    defaultValues,
    validationLogic: submitThenChange,
    onSubmit: ({ value }) => onSubmit(value),
  });
}

function EntityFields({
  form,
  fields,
  error,
  idPrefix,
  images,
}: {
  form: ReturnType<typeof useValuesForm>;
  fields: EntityField[];
  error: unknown;
  idPrefix: string;
  images?: ImageTracking;
}) {
  return fields.map((field) => (
    <form.Field
      key={field.name}
      name={field.name}
      validators={{ onDynamic: ({ value }) => validateField(field, value) }}
    >
      {(f) => {
        const id = `${idPrefix}-${field.name}`;
        return (
          <FormField
            label={field.label}
            htmlFor={id}
            error={fieldError(f, error)}
            hint={field.hint}
            required={field.required}
          >
            {renderControl(field, id, f.state.value, f.handleChange, f.handleBlur, images)}
          </FormField>
        );
      }}
    </form.Field>
  ));
}

export function EntityForm({
  sections,
  defaultValues,
  onSubmit,
  error,
  pending,
  submitLabel,
  cancelTo,
  images,
}: EntityFormProps) {
  const form = useValuesForm(defaultValues, onSubmit);

  const dirty = useStore(form.store, (state) => state.isDirty);

  return (
    <AdminForm
      dirty={dirty}
      error={error}
      onSubmit={() => form.handleSubmit()}
      aside={sections
        .flatMap((section) => section.fields)
        .filter((field) => field.kind === "image")
        .map((field) => (
          <FormAsideCard key={field.name}>
            <EntityFields form={form} fields={[field]} error={error} idPrefix="field" images={images} />
          </FormAsideCard>
        ))}
      actions={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <FormActions
              cancelTo={cancelTo}
              submitLabel={submitLabel}
              pending={pending || isSubmitting}
            />
          )}
        </form.Subscribe>
      }
    >
      {sections.flatMap((section) => {
        const fields = section.fields.filter((field) => field.kind !== "image");
        return fields.length > 0
          ? [
              <FormSection key={section.title} title={section.title} description={section.description}>
                <EntityFields form={form} fields={fields} error={error} idPrefix="field" images={images} />
              </FormSection>,
            ]
          : [];
      })}
    </AdminForm>
  );
}

function renderControl(
  field: EntityField,
  id: string,
  value: string,
  onChange: (value: string) => void,
  onBlur: () => void,
  images?: ImageTracking,
) {
  switch (field.kind) {
    case "textarea":
      return (
        <Textarea
          id={id}
          rows={6}
          maxLength={maxLengthOf(field)}
          placeholder={field.placeholder}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <select
          id={id}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className={NATIVE_SELECT_CLASS}
        >
          {field.required ? null : <option value="">None</option>}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "date":
      return (
        <DatePicker
          id={id}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder ?? "Select a date"}
        />
      );
    case "custom":
      return field.render({ id, value, onChange });
    case "image":
      return (
        <ImageUpload
          id={id}
          kind={field.mediaKind}
          value={value || null}
          onChange={(url) => onChange(url ?? "")}
          onImageReplaced={images?.onImageReplaced}
          onUploaded={images?.onImageUploaded}
        />
      );
    case "search":
      return (
        <SearchableSelect
          id={id}
          value={value}
          onChange={onChange}
          getQueryOptions={field.getQueryOptions}
          placeholder={field.placeholder}
          emptyText={field.emptyText}
          initialLabel={field.initialLabel}
        />
      );
    default:
      return (
        <Input
          id={id}
          type={field.kind === "number" ? "number" : field.kind === "url" ? "url" : "text"}
          inputMode={field.kind === "number" ? "numeric" : field.kind === "url" ? "url" : undefined}
          min={field.kind === "number" ? field.min : undefined}
          max={field.kind === "number" ? field.max : undefined}
          step={field.kind === "number" ? 1 : undefined}
          maxLength={field.kind === "number" ? undefined : maxLengthOf(field)}
          autoComplete="off"
          placeholder={field.placeholder ?? (field.kind === "url" ? "https://..." : undefined)}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export const optional = (value: string) => (value.trim() ? value.trim() : null);
export const optionalNumber = (value: string) => (value.trim() ? Number(value) : null);

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: EntityField[];
  defaultValues: Values;
  /** Close the dialog from the mutation's onSuccess. */
  onSubmit: (values: Values) => void;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  images?: ImageTracking;
}

/** Add or edit a child record (a link, a podium) without leaving its parent page. */
export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  ...formProps
}: EntityFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-170">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {open ? <DialogForm {...formProps} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function DialogForm({
  fields,
  defaultValues,
  onSubmit,
  error,
  pending,
  submitLabel,
  images,
}: Pick<
  EntityFormDialogProps,
  "fields" | "defaultValues" | "onSubmit" | "error" | "pending" | "submitLabel" | "images"
>) {
  const form = useValuesForm(defaultValues, onSubmit);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <EntityFields form={form} fields={fields} error={error} idPrefix="dialog" images={images} />
      <FormErrorSummary error={error} />
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="secondary" size="pill" />}>Cancel</DialogClose>
        <Button type="submit" size="pill" loading={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
