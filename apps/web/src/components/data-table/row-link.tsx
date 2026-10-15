import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/** The primary cell of an admin row: opens the record's edit page. */
export function RowLink({ to, id, children }: { to: string; id: number; children: ReactNode }) {
  return (
    <Link to={to} params={{ id }} className="font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
