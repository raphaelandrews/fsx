"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { SparklesIcon, Loader2 as SpinnerIcon } from "lucide-react";
import slugify from "react-slugify";
import { nanoid } from "nanoid";

import { UpdatePost } from "../../actions/update-post";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import MDXEditor from "./mdx-editor";
import type { PostBySlug } from "@/db/queries";

export const dynamic = "force-dynamic";

const Editor = ({ post }: {post: PostBySlug}) => {
  const router = useRouter();
  const [fileUrl] = useState<string | null>(post?.image);

  const [isSaving, setIsSaving] = useState(false);
  const [showLoadingAlert, setShowLoadingAlert] = useState<boolean>(false);


  const [content, setContent] = useState<string | null>(post?.content || null);

  const defaultValues = {
    title: post.title ?? "Untitled",
    slug: post.slug ?? `post-${nanoid()}`,
    image: fileUrl ?? "",
    content: content ?? "Type here your blog post content",
  };

  const form = useForm({
    resolver: zodResolver(PostBySlug),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: PostBySlug) {
    setShowLoadingAlert(true);
    setIsSaving(true);

    const response = await UpdatePost({
      id: post.id,
      title: data.title,
      slug: data.slug,
      image: fileUrl || "",
      content: content || "",
    });

    if (response) {
      toast.success("Your post has been updated");
      router.push("/posts?search=refresh");
    } else {
      toast.error("Error updating your post");
    }

    setIsSaving(false);
    setShowLoadingAlert(false);
  }

  const onChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>General information</CardTitle>
              <CardDescription>
                Update your post's general information
              </CardDescription>
            </CardHeader>
            <Separator className="mb-8" />
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full max-w-md">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please provide a title for your blog post"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="w-full max-w-md">
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please provide a slug for your blog post"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          field.onChange(slugify(form.getValues("title")))
                        }
                      >
                        <SparklesIcon className="mr-2 h-4 w-4" />
                        Generate slug
                      </Button>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <MDXEditor content={post.content || ""} onChange={onChange} />

          <div className="infline-flex flex items-center justify-start space-x-3">
            <Button
              type="submit"
              className="flex !bg-gray-900 px-10 !text-white hover:!bg-gray-800"
              disabled={isSaving}
            >
              Update
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="flex !bg-gray-100 px-10 !text-gray-900 hover:!bg-gray-200"
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
      <AlertDialog open={showLoadingAlert} onOpenChange={setShowLoadingAlert}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Please wait...
            </AlertDialogTitle>
            <AlertDialogDescription className="mx-auto text-center">
              <SpinnerIcon className="h-6 w-6 animate-spin" />
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Editor;
