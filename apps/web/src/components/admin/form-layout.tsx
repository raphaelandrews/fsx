import { createContext, useContext, useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

import { Button, buttonVariants } from "@fsx/ui/components/button";

import { HEADER_SLOT_ID, InSlot } from "@/components/admin/admin-slots";
import { InlineAlert } from "@/components/admin/inline-alert";
import { LeaveGuard } from "@/components/admin/leave-guard";
import { getAdminErrorMessage, getFieldErrorList } from "@/lib/errors";

interface AdminFormProps {
  onSubmit: () => void;
  children: ReactNode;
  /** Bottom bar: usually <FormActions />. */
  actions: ReactNode;
  /** The mutation error, summarized above the actions so it stays on the page. */
  error?: unknown;
  /** Cards in a narrower column beside the fields, e.g. the photo. */
  aside?: ReactNode;
  /** The form has edits that were not saved yet; leaving the page then asks first. */
  dirty?: boolean;
}

const FormIdContext = createContext<string | undefined>(undefined);

export const FormDialogContext = createContext<(() => void) | null>(null);

/** What went wrong with the last save, in words; focused when it appears so it is announced and in view. */
export function FormErrorSummary({ error }: { error: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error) return;
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    ref.current?.focus({ preventScroll: true });
  }, [error]);
  if (!error) return null;

  const fields = getFieldErrorList(error);
  return (
    <div ref={ref} tabIndex={-1} className="mt-6 outline-none">
      <InlineAlert tone="error" title={fields.length > 0 ? "Check these fields and save again" : "Could not save"}>
        {fields.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4">
            {fields.map(({ field, message }) => (
              <li key={field}>
                <strong className="font-medium">{field}:</strong> {message}
              </li>
            ))}
          </ul>
        ) : (
          getAdminErrorMessage(error, "The changes were not saved. Try again.")
        )}
      </InlineAlert>
    </div>
  );
}

export function AdminForm({ onSubmit, children, actions, error, aside, dirty = false }: AdminFormProps) {
  const formId = useId();
  const inDialog = useContext(FormDialogContext) !== null;
  const saving = useRef(false);
  useEffect(() => {
    if (error) saving.current = false;
  }, [error]);

  return (
    <FormIdContext.Provider value={formId}>
      <form
        id={formId}
        className="w-full"
        noValidate
        onChange={() => {
          saving.current = false;
        }}
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          saving.current = true;
          onSubmit();
        }}
      >
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-3">
          <div className="space-y-8 @lg:col-span-2">{children}</div>
          {aside ? <div className="flex flex-col gap-4">{aside}</div> : null}
        </div>
        <FormErrorSummary error={error} />
        {actions}
      </form>
      {inDialog ? null : <LeaveGuard dirty={dirty} saving={saving} />}
    </FormIdContext.Provider>
  );
}

/** One card in the narrower column: a titled box around a control such as an image upload. */
export function FormAsideCard({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">{children}</div>;
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled group of fields: the title and description above, one column of controls below. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

/** Content section without a form, e.g. a related-records table under an edit form. */
export function AdminSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">{title}</h2>
          {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

interface FormActionsProps {
  cancelTo?: LinkProps["to"];
  submitLabel: string;
  pendingLabel?: string;
  pending: boolean;
  disabled?: boolean;
}

export function FormActions({ cancelTo, submitLabel, pendingLabel = "Saving...", pending, disabled }: FormActionsProps) {
  const formId = useContext(FormIdContext);
  const closeDialog = useContext(FormDialogContext);
  const label = pending ? pendingLabel : submitLabel;
  // On a page with a header the save button sits at its top right, and the back button is the way out.
  return (
    <InSlot
      id={HEADER_SLOT_ID}
      fallback={
        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
          {closeDialog || !cancelTo ? (
            <Button type="button" variant="secondary" size="lg" onClick={closeDialog ?? undefined}>
              Cancel
            </Button>
          ) : (
            <Link to={cancelTo} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Cancel
            </Link>
          )}
          <Button type="submit" size="lg" loading={pending} disabled={disabled}>
            {label}
          </Button>
        </div>
      }
    >
      <>
        <Button type="submit" form={formId} size="xl" loading={pending} disabled={disabled} className="max-lg:hidden">
          {label}
        </Button>
        <div className="fixed inset-x-0 bottom-0 z-40 flex bg-background p-4 shadow-[0_-4px_16px_rgb(0_0_0/0.08)] lg:hidden">
          <Button type="submit" form={formId} size="xl" loading={pending} disabled={disabled} className="flex-1">
            {label}
          </Button>
        </div>
      </>
    </InSlot>
  );
}
