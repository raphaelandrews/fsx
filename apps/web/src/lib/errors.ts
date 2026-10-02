import type { AppRouter } from "@fsx/api/routers/index";
import type { TRPCClientErrorLike } from "@trpc/client";
import { toast } from "sonner";

type AppError = TRPCClientErrorLike<AppRouter>;

const USER_MESSAGES: Record<string, string> = {
  BAD_REQUEST: "Verifique os dados informados.",
  UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "O registro não foi encontrado. Atualize a página e tente novamente.",
  CONFLICT: "Os dados foram alterados por outra operação. Atualize a página e tente novamente.",
  TOO_MANY_REQUESTS: "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
  INTERNAL_SERVER_ERROR: "Não foi possível concluir a operação. Tente novamente mais tarde.",
};

export function getErrorCode(error: unknown): string | undefined {
  return (error as AppError | undefined)?.data?.code;
}

export function getUserErrorMessage(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  return USER_MESSAGES[getErrorCode(error) ?? ""] ?? fallback;
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

export function showMutationError(
  error: unknown,
  fallback: string,
  retryOnConflict?: () => void,
): void {
  toast.error(getUserErrorMessage(error, fallback), {
    action:
      getErrorCode(error) === "CONFLICT" && retryOnConflict
        ? { label: "Recarregar", onClick: retryOnConflict }
        : undefined,
  });
}

export function isExpectedQueryError(error: unknown): boolean {
  return ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"].includes(getErrorCode(error) ?? "");
}
