import { describe, expect, test } from "bun:test";

import {
  fieldError,
  getAdminErrorMessage,
  getErrorCode,
  getFieldError,
  getUserErrorMessage,
  isAdminPath,
  isExpectedQueryError,
} from "./errors";

describe("user-facing error mapping", () => {
  test("maps tRPC codes without exposing server messages", () => {
    const error = { message: "SQLITE secret", data: { code: "CONFLICT" } };
    expect(getErrorCode(error)).toBe("CONFLICT");
    expect(getUserErrorMessage(error)).toContain("alterados");
    expect(getUserErrorMessage(error)).not.toContain("SQLITE");
  });

  test("maps every supported server category to a safe Portuguese message", () => {
    const cases = [
      ["BAD_REQUEST", "Verifique os dados informados."],
      ["UNAUTHORIZED", "Sua sessão expirou. Entre novamente."],
      ["FORBIDDEN", "Você não tem permissão para realizar esta ação."],
      ["NOT_FOUND", "O registro não foi encontrado. Atualize a página e tente novamente."],
      ["CONFLICT", "Os dados foram alterados por outra operação. Atualize a página e tente novamente."],
      ["TOO_MANY_REQUESTS", "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
      ["INTERNAL_SERVER_ERROR", "Não foi possível concluir a operação. Tente novamente mais tarde."],
    ] as const;

    for (const [code, message] of cases) {
      const error = { message: "SQLITE INTERNAL DETAIL", data: { code } };
      expect(getUserErrorMessage(error)).toBe(message);
      expect(getUserErrorMessage(error)).not.toContain("SQLITE");
    }
  });

  test("identifies expected query errors", () => {
    expect(isExpectedQueryError({ data: { code: "NOT_FOUND" } })).toBe(true);
    expect(isExpectedQueryError({ data: { code: "INTERNAL_SERVER_ERROR" } })).toBe(false);
  });

  test("reads field-level validation errors", () => {
    expect(
      getFieldError({ data: { zodError: { fieldErrors: { name: ["Nome obrigatório"] } } } }, "name"),
    ).toBe("Nome obrigatório");
  });

  test("maps every server category to a safe English message for the dashboard", () => {
    for (const code of ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "TOO_MANY_REQUESTS", "INTERNAL_SERVER_ERROR"]) {
      const message = getUserErrorMessage({ message: "SQLITE secret", data: { code } }, "fallback", "en");
      expect(message).not.toContain("SQLITE");
      expect(message).not.toBe("fallback");
      expect(message).toMatch(/^[ -~]+$/);
    }
    expect(getUserErrorMessage({ data: {} }, "Failed to save club", "en")).toBe("Failed to save club");
  });

  test("shows the dashboard the server's curated explanation only when one is provided", () => {
    const blocked = { message: "raw", data: { code: "CONFLICT", userMessage: "Revert the results first." } };
    expect(getAdminErrorMessage(blocked, "Failed to delete")).toBe("Revert the results first.");
    const internal = { message: "SQLITE secret", data: { code: "INTERNAL_SERVER_ERROR", userMessage: null } };
    expect(getAdminErrorMessage(internal, "Failed to delete")).not.toContain("SQLITE");
  });

  test("detects admin paths for message language", () => {
    expect(isAdminPath("/dashboard/clubs")).toBe(true);
    expect(isAdminPath("/rating-update")).toBe(true);
    expect(isAdminPath("/ratings")).toBe(false);
  });

  test("prefers the client validation message, then the server field error", () => {
    const serverError = { data: { zodError: { fieldErrors: { logoUrl: ["Invalid URL"] } } } };
    const field = (errors: unknown[]) => ({ name: "logoUrl", state: { meta: { errors } } });
    expect(fieldError(field([{ message: "Name is required" }]), serverError)).toBe("Name is required");
    expect(fieldError(field(["Too short"]), serverError)).toBe("Too short");
    expect(fieldError(field([undefined]), serverError)).toBe("Invalid URL");
    expect(fieldError(field([]), null)).toBeUndefined();
  });
});
