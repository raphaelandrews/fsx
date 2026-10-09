import type { CSSProperties, ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@fsx/ui/components/sidebar";

import { AdminSidebar, type SidebarUser } from "@/components/admin/admin-sidebar";
import { findActiveNav } from "@/components/header/admin-nav-data";

export function AdminShell({ user, children }: { user?: SidebarUser; children: ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width-icon": "3.5rem" } as CSSProperties}>
      <AdminSidebar user={user} />
      <SidebarInset className="min-w-0 md:peer-data-[variant=inset]:rounded-4xl md:peer-data-[variant=inset]:shadow-none">
        <AdminTopbar />
        <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-8 sm:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminTopbar() {
  const { pathname } = useLocation();
  const { group, item } = findActiveNav(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6">
      <SidebarTrigger className="-ml-2 size-10 text-muted-foreground md:hidden" size="icon-lg" />
      {item ? (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-base">
          {group && group.label !== item.label ? (
            <>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon className="size-4" icon={group.icon} strokeWidth={2} />
                {group.label}
              </span>
              <HugeiconsIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
                icon={ArrowRight01Icon}
                strokeWidth={2}
              />
            </>
          ) : null}
          <span aria-current="page" className="flex min-w-0 items-center gap-1.5 font-semibold text-title">
            <HugeiconsIcon className="size-4 shrink-0" icon={item.icon} strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </span>
        </nav>
      ) : null}
    </header>
  );
}
