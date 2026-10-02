import type { AppRouter } from "@fsx/api/routers/index";
import type { TRPCClientErrorLike } from "@trpc/client";
import { notFound } from "@tanstack/react-router";
import { toast } from "sonner";

type AppError = TRPCClientErrorLike<AppRouter>;
export type Locale = "pt" | "en";

// The public site is Portuguese; the admin dashboard is English.
const USER_MESSAGES: Record<Locale, Record<string, string>> = {
  pt: {
    BAD_REQUEST: "Verifique os dados informados.",
    UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
    FORBIDDEN: "Você não tem permissão para realizar esta ação.",
    NOT_FOUND: "O registro não foi encontrado. Atualize a página e tente novamente.",
    CONFLICT: "Os dados foram alterados por outra operação. Atualize a página e tente novamente.",
    TOO_MANY_REQUESTS: "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
    INTERNAL_SERVER_ERROR: "Não foi possível concluir a operação. Tente novamente mais tarde.",
  },
  en: {
    BAD_REQUEST: "Check the highlighted fields and try again.",
    UNAUTHORIZED: "Your session expired. Sign in again.",
    FORBIDDEN: "You do not have permission to do this.",
    NOT_FOUND: "This record no longer exists. Reload the page and try again.",
    CONFLICT: "This conflicts with an existing record or a newer change. Check the data, or reload and try again.",
    TOO_MANY_REQUESTS: "Too many attempts. Wait a moment and try again.",
    INTERNAL_SERVER_ERROR: "Something went wrong on the server. Try again later.",
  },
};

const DEFAULT_FALLBACK: Record<Locale, string> = {
  pt: "Não foi possível concluir a operação.",
  en: "The operation could not be completed.",
};

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/rating-update");
}

export function getErrorCode(error: unknown): string | undefined {
  return (error as AppError | undefined)?.data?.code;
}

export function getUserErrorMessage(error: unknown, fallback?: string, locale: Locale = "pt"): string {
  return USER_MESSAGES[locale][getErrorCode(error) ?? ""] ?? fallback ?? DEFAULT_FALLBACK[locale];
}

export function getFieldError(error: unknown, field: string): string | undefined {
  const zodError = (error as AppError | undefined)?.data?.zodError as
    | { fieldErrors?: unknown }
    | null
    | undefined;
  const fieldErrors = zodError?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return undefined;
  const messages = (fieldErrors as Record<string, unknown>)[field];
  const message = Array.isArray(messages) ? messages[0] : undefined;
  return typeof message === "string" ? message : undefined;
}

type FieldLike = { name: string; state: { meta: { errors: unknown[] } } };

/** First client validation message for a form field, else the server's message for it. */
export function fieldError(field: FieldLike, mutationError: unknown): string | undefined {
  const client = field.state.meta.errors.find(Boolean) as { message?: string } | string | undefined;
  if (typeof client === "string") return client;
  if (client?.message) return client.message;
  return getFieldError(mutationError, field.name);
}

/** The server's explanation of a rejected admin request, else the generic English message. */
export function getAdminErrorMessage(error: unknown, fallback: string): string {
  return (error as AppError | undefined)?.data?.userMessage ?? getUserErrorMessage(error, fallback, "en");
}

/** Admin mutation failure toast; offers a reload when the data changed underneath. */
export function showMutationError(error: unknown, fallback: string, retryOnConflict?: () => void): void {
  toast.error(getAdminErrorMessage(error, fallback), {
    action:
      getErrorCode(error) === "CONFLICT" && retryOnConflict
        ? { label: "Reload", onClick: retryOnConflict }
        : undefined,
  });
}

export function isExpectedQueryError(error: unknown): boolean {
  return ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"].includes(getErrorCode(error) ?? "");
}

export async function orNotFound<T>(load: Promise<T>): Promise<T> {
  try {
    return await load;
  } catch (error) {
    if (getErrorCode(error) === "NOT_FOUND") throw notFound();
    throw error;
  }
}
