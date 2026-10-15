import { useRouterState } from "@tanstack/react-router"

import { isAdminPath } from "@/lib/errors"

import { AdminFormSkeleton, AdminTableSkeleton } from "./admin-skeletons"
import { PageSkeleton } from "./page-skeleton"

const ADMIN_PAGES_WITHOUT_TABLE = new Set(["backup", "cache", "user", "swiss-manager"])

/** The router's default pending screen, shaped like the page being opened. */
export function RoutePending() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (!isAdminPath(pathname)) return <PageSkeleton />

  const [root, section, ...rest] = pathname.split("/").filter(Boolean)
  if (root !== "dashboard" || !section || ADMIN_PAGES_WITHOUT_TABLE.has(section)) return <PageSkeleton />
  return rest.length > 0 ? <AdminFormSkeleton /> : <AdminTableSkeleton />
}
