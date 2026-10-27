// Shared by the zod inputs and the dashboard forms, so the browser never accepts what the server rejects.
export const TEXT_MAX = 160;
export const URL_MAX = 2_048;
export const LONG_TEXT_MAX = 500_000;
// D1 rows hold at most 2 MB; multi-byte text counts by bytes, with room left for the other columns.
export const LONG_TEXT_MAX_BYTES = 1_800_000;

// Zod counts characters as code points, so the forms must too: an emoji is one character, not two.
export const charLength = (text: string) => {
  let count = 0;
  for (const _ of text) count++;
  return count;
};

export const byteLength = (text: string) => new TextEncoder().encode(text).byteLength;
