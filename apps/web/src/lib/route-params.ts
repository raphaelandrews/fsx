import { notFound } from "@tanstack/react-router";

// Numeric `$id` segments: anything but a positive safe integer renders the
// not-found page instead of reaching the API as a NaN/BAD_REQUEST.
export const idParams = {
  parse: ({ id }: { id: string }): { id: number } => {
    const value = Number(id);
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(value)) throw notFound();
    return { id: value };
  },
  stringify: ({ id }: { id: number }) => ({ id: String(id) }),
};
