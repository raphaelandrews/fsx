import { useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";

export const createIntentSearch = z.object({ novo: z.boolean().optional().catch(undefined) });

export function useCreateIntent(): [boolean, (open: boolean) => void] {
  const search = useSearch({ strict: false }) as { novo?: unknown };
  const navigate = useNavigate();
  const setOpen = (open: boolean) => {
    void navigate({
      to: ".",
      search: ((previous: Record<string, unknown>) => ({ ...previous, novo: open ? true : undefined })) as never,
      replace: true,
    });
  };
  return [search.novo === true, setOpen];
}
