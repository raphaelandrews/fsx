import type { LinkProps } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";

import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { AdminForm, FormActions, FormAsideCard, FormSection } from "@/components/admin/form-layout";
import { FormField } from "@/components/form/form-field";
import { ImageUpload } from "@/components/media/image-upload";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { fieldError, getFieldError } from "@/lib/errors";
import { LONG_TEXT_MAX, requiredText, submitThenChange, TEXT_MAX } from "@/lib/field-rules";
import { sanitizeTitle, slugify } from "@/lib/slugify";

export interface PostValues {
  title: string;
  slug: string;
  imageUrl: string;
  content: string;
  published: boolean;
  /** `datetime-local` value in Brasília time, empty to publish immediately. */
  publishAt: string;
}

interface PostFormProps {
  defaultValues: PostValues;
  onSubmit: (values: PostValues) => void;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  cancelTo?: LinkProps["to"];
  /** Keep the stored address when the title changes (published posts). */
  lockSlug?: boolean;
  onImageReplaced: (url: string) => void;
  onImageUploaded: (url: string) => void;
}

export function PostForm({
  defaultValues,
  onSubmit,
  error,
  pending,
  submitLabel,
  cancelTo,
  lockSlug = false,
  onImageReplaced,
  onImageUploaded,
}: PostFormProps) {
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
      aside={
        <FormAsideCard>
          <div>
            <h2 className="font-medium text-sm">Cover image</h2>
            <p className="mt-1 text-muted-foreground text-sm">Shown on the news list and when the article is shared. Cropped to 16:9.</p>
          </div>
        <form.Field name="imageUrl">
          {(f) => (
            <ImageUpload
              kind="posts"
              value={f.state.value || null}
              onChange={(url) => f.handleChange(url ?? "")}
              onImageReplaced={onImageReplaced}
              onUploaded={onImageUploaded}
              aspectRatio={16 / 9}
              outputWidth={896}
              title="Crop cover image"
              description="Adjust the crop area to fit a 16:9 aspect ratio."
            />
          )}
        </form.Field>
        </FormAsideCard>
      }
      actions={<FormActions cancelTo={cancelTo} submitLabel={submitLabel} pending={pending} />}
    >
      <FormSection
        title="Article"
        description="The title sets the address of a new article; saved articles keep theirs."
      >
        <form.Field name="title" validators={{ onDynamic: requiredText("Title") }}>
          {(f) => (
            <FormField
              label="Title"
              htmlFor="post-title"
              required
              error={fieldError(f, error)}
            >
              <Input
                id="post-title"
                maxLength={TEXT_MAX}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => {
                  const value = sanitizeTitle(e.target.value);
                  f.handleChange(value);
                  if (!lockSlug) form.setFieldValue("slug", slugify(value));
                }}
              />
            </FormField>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.slug}>
          {(slug) => (
            <FormField label="Address" htmlFor="post-slug" error={getFieldError(error, "slug")}>
              <Input id="post-slug" value={slug ? `/noticias/${slug}` : ""} readOnly disabled />
            </FormField>
          )}
        </form.Subscribe>
        <form.Field name="content" validators={{ onDynamic: requiredText("Content", LONG_TEXT_MAX) }}>
          {(f) => (
            <FormField
              label="Content"
              htmlFor="post-content"
              required
              hint="Markdown is supported."
              error={fieldError(f, error)}
            >
              <MarkdownEditor
                id="post-content"
                rows={14}
                value={f.state.value}
                onChange={f.handleChange}
              />
            </FormField>
          )}
        </form.Field>
      </FormSection>
      <FormSection title="Publishing" description="Drafts are only visible in the dashboard. A schedule keeps a published article hidden until then.">
        <form.Field name="published">
          {(f) => (
            <div className="flex items-center gap-2">
              <input
                id="post-published"
                type="checkbox"
                checked={f.state.value}
                onChange={(e) => f.handleChange(e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              <Label htmlFor="post-published">Published</Label>
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.published}>
          {(published) =>
            published ? (
              <form.Field name="publishAt">
                {(f) => (
                  <FormField
                    label="Publish at"
                    htmlFor="post-publish-at"
                    hint="Brasília time. Leave empty to publish now. Public pages are cached for about two minutes, so it can go live that much later."
                    error={fieldError(f, error)}
                  >
                    <Input
                      id="post-publish-at"
                      type="datetime-local"
                      value={f.state.value}
                      onBlur={f.handleBlur}
                      onChange={(e) => f.handleChange(e.target.value)}
                    />
                  </FormField>
                )}
              </form.Field>
            ) : null
          }
        </form.Subscribe>
      </FormSection>
    </AdminForm>
  );
}
