import type { CSSProperties, ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@fsx/ui/components/sidebar";

import { DANGER_SLOT_ID } from "@/components/admin/admin-slots";
import { AdminSidebar, type SidebarUser } from "@/components/admin/admin-sidebar";
import { findActiveNav } from "@/components/admin/admin-nav-data";

// A gray canvas with a white sidebar on the left and the page as a white rounded panel, under a breadcrumb bar.
export function AdminShell({ user, children }: { user?: SidebarUser; children: ReactNode }) {
  return (
    <SidebarProvider
      className="bg-muted"
      style={{ "--sidebar-width": "16.5rem", "--sidebar-width-icon": "3.5rem", "--sidebar": "var(--background)" } as CSSProperties}
    >
      <AdminSidebar user={user} />
      <SidebarInset className="min-w-0 bg-transparent">
        <AdminTopbar />
        <div className="@container mb-6 flex min-h-0 flex-1 flex-col rounded-t-4xl bg-background md:mx-6 md:rounded-4xl">
          <AdminContent>{children}</AdminContent>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminContent({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="fade-in-0 w-full flex-1 animate-in p-4 pb-24 duration-150 sm:p-6 lg:pb-8">
      {children}
      <div id={DANGER_SLOT_ID} className="flex flex-wrap justify-end gap-3 pt-8 empty:hidden" />
    </div>
  );
}

function AdminTopbar() {
  const { pathname } = useLocation();
  const { group, item } = findActiveNav(pathname);

  return (
    <header className="flex shrink-0 items-center gap-2 p-4 sm:p-6">
      <SidebarTrigger className="-ml-2 size-10 text-muted-foreground md:hidden" size="icon-lg" />
      {item ? (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2.5 font-medium text-base text-muted-foreground">
          {group && group.label !== item.label ? (
            <>
              <span className="flex items-center gap-2">
                <HugeiconsIcon className="size-5 shrink-0" icon={group.icon} strokeWidth={2} />
                {group.label}
              </span>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span aria-current="page" className="flex min-w-0 items-center gap-2 text-title">
            <HugeiconsIcon className="size-5 shrink-0" icon={item.icon} strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </span>
        </nav>
      ) : null}
    </header>
  );
}
