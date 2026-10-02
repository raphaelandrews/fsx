import { describe, expect, test } from "bun:test";

import { getErrorCode, getFieldError, getUserErrorMessage, isExpectedQueryError } from "./errors";

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
});
