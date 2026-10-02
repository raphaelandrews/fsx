import { TRPCError } from "@trpc/server";

export const EVENT_LINK_VALUES = ["regulation", "form", "results"] as const;

export function validateEventLinkTypes(types: readonly string[]): void {
  if (new Set(types).size !== types.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Each event link type can only be provided once",
    });
  }
}

export function requireOwnedEventLink(
  existingIds: ReadonlySet<number>,
  linkId: number,
): void {
  if (!existingIds.has(linkId)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Event link not found" });
  }
}
