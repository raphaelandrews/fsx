"use client";

import PostEditButton from "./post-edit-button";
import type { Row } from "@tanstack/react-table";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  return <PostEditButton id={row.getValue("id")} />;
}
