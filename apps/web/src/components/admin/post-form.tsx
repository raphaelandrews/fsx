import type { LinkProps } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";

import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { AdminForm, FormActions, FormSection } from "@/components/admin/form-layout";
import { FormField } from "@/components/form/form-field";
import { ImageUpload } from "@/components/image-upload";
import { MarkdownEditor } from "@/components/markdown-editor";
import { fieldError, getFieldError } from "@/lib/errors";
import { sanitizeTitle, slugify } from "@/utils/slugify";

export interface PostValues {
  title: string;
  slug: string;
  imageUrl: string;
  content: string;
  published: boolean;
}

interface PostFormProps {
  defaultValues: PostValues;
  onSubmit: (values: PostValues) => void;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  cancelTo: LinkProps["to"];
  onImageReplaced: (url: string) => void;
  onImageUploaded: (url: string) => void;
}

const required =
  (label: string) =>
  ({ value }: { value: string }) =>
    value.trim() ? undefined : `${label} is required`;

export function PostForm({
  defaultValues,
  onSubmit,
  error,
  pending,
  submitLabel,
  cancelTo,
  onImageReplaced,
  onImageUploaded,
}: PostFormProps) {
  const form = useForm({ defaultValues, onSubmit: ({ value }) => onSubmit(value) });

  return (
    <AdminForm
      onSubmit={() => form.handleSubmit()}
      actions={<FormActions cancelTo={cancelTo} submitLabel={submitLabel} pending={pending} />}
    >
      <FormSection title="Article" description="The title also sets the article's address.">
        <form.Field name="title" validators={{ onSubmit: required("Title") }}>
          {(f) => (
            <FormField
              label="Title"
              htmlFor="post-title"
              required
              error={fieldError(f, error)}
            >
              <Input
                id="post-title"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => {
                  const value = sanitizeTitle(e.target.value);
                  f.handleChange(value);
                  form.setFieldValue("slug", slugify(value));
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
        <form.Field name="content" validators={{ onSubmit: required("Content") }}>
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
      <FormSection
        title="Cover image"
        description="Shown on the news list and when the article is shared. Cropped to 16:9."
      >
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
      </FormSection>
      <FormSection title="Publishing" description="Drafts are only visible in the dashboard.">
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
      </FormSection>
    </AdminForm>
  );
}
