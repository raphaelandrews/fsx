import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  Home01Icon,
  Logout01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@fsx/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@fsx/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@fsx/ui/components/sidebar";
import { Skeleton } from "@fsx/ui/components/skeleton";

import { ADMIN_NAV, isNavActive } from "@/components/admin/admin-nav-data";
import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";

const ACTIVE_ROW =
  "text-muted-foreground hover:bg-muted data-active:bg-primary data-active:font-semibold data-active:text-primary-foreground data-active:hover:bg-primary data-active:hover:text-primary-foreground data-active:[&_svg]:text-primary-foreground [&_svg]:size-5 [&_svg]:text-muted-foreground";

const RAIL_BUTTON =
  "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl";

const MENU_BUTTON = `h-auto rounded-lg p-3 text-sm font-semibold ${RAIL_BUTTON} ${ACTIVE_ROW}`;
const SUB_BUTTON = `h-auto rounded-lg p-3 text-sm font-semibold ${ACTIVE_ROW}`;

const REQUESTS_PATH = "/dashboard/update-requests";

/** Update requests waiting for review; quiet (zero) until the first answer arrives. */
function usePendingRequests() {
  const trpc = useTRPC();
  return useQuery(trpc.stats.counts.queryOptions()).data?.pendingRequests ?? 0;
}

function PendingBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={`rounded-full bg-warning px-1.5 font-semibold text-warning-foreground text-xs tabular-nums ${className ?? ""}`}
    >
      {count}
      <span className="sr-only"> pending</span>
    </span>
  );
}

function leafItems() {
  return ADMIN_NAV.flatMap((entry) => entry.items ?? [entry]);
}

export type SidebarUser = { name: string; email: string; image?: string | null };

export function AdminSidebar({ user }: { user?: SidebarUser }) {
  const { pathname } = useLocation();
  const { setOpenMobile, state, isMobile } = useSidebar();
  const pending = usePendingRequests();
  const closeMobile = () => setOpenMobile(false);
  const collapsed = state === "collapsed" && !isMobile;
  const secondary = ADMIN_NAV.filter((entry) => entry.secondary);
  const main = ADMIN_NAV.filter((entry) => !entry.secondary);

  const renderEntry = (entry: (typeof ADMIN_NAV)[number]) =>
    entry.items?.length ? (
                    <Collapsible
                      key={entry.label}
                      defaultOpen={entry.items.some((sub) => isNavActive(pathname, sub.to))}
                      className="group/collapsible"
                      render={<SidebarMenuItem />}
                    >
                      <SidebarMenuButton render={<CollapsibleTrigger />} className={MENU_BUTTON}>
                        <HugeiconsIcon icon={entry.icon} strokeWidth={2} />
                        <span>{entry.label}</span>
                        {pending > 0 && entry.items.some((sub) => sub.to === REQUESTS_PATH) ? (
                          <PendingBadge count={pending} className="ml-auto" />
                        ) : null}
                        <HugeiconsIcon
                          className={`${pending > 0 && entry.items.some((sub) => sub.to === REQUESTS_PATH) ? "ml-1" : "ml-auto"} transition-transform duration-200 ease-out group-data-open/collapsible:rotate-180`}
                          icon={ArrowDown01Icon}
                          strokeWidth={2}
                        />
                      </SidebarMenuButton>
                      <CollapsibleContent>
                        <SidebarMenuSub className="mt-1 mr-0 ml-8 gap-1 border-l-0 px-0">
                          {entry.items.map((sub) => (
                            <SidebarMenuSubItem key={sub.to}>
                              <SidebarMenuSubButton
                                className={SUB_BUTTON}
                                isActive={isNavActive(pathname, sub.to)}
                                render={
                                  <Link to={sub.to} onClick={closeMobile}>
                                    <HugeiconsIcon className="size-4" icon={sub.icon} strokeWidth={2} />
                                    <span>{sub.label}</span>
                                    {sub.to === REQUESTS_PATH && pending > 0 ? <PendingBadge count={pending} className="ml-auto" /> : null}
                                  </Link>
                                }
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={entry.to}>
                      <SidebarMenuButton
                        className={MENU_BUTTON}
                        isActive={isNavActive(pathname, entry.to)}
                        render={
                          <Link to={entry.to} onClick={closeMobile}>
                            <HugeiconsIcon icon={entry.icon} strokeWidth={2} />
                            <span>{entry.label}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="gap-3 p-4 pb-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <Link
            to="/dashboard"
            aria-label="Admin dashboard"
            onClick={closeMobile}
            className="flex h-10 items-center gap-2 rounded-lg px-2 outline-none focus-visible:outline-2 focus-visible:outline-ring group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:bg-background group-data-[collapsible=icon]:p-0"
          >
            <Logo className="h-6 w-auto group-data-[collapsible=icon]:h-3" />
            <span className="font-semibold text-base tracking-tight group-data-[collapsible=icon]:hidden">
              Admin
            </span>
          </Link>
          <SidebarTrigger
            className="hidden size-10 text-muted-foreground md:inline-flex group-data-[collapsible=icon]:order-first"
            size="icon-lg"
          />
        </div>
        <Link
          to="/"
          onClick={closeMobile}
          className="flex items-center gap-2 rounded-lg border bg-background p-2 outline-none focus-visible:outline-2 focus-visible:outline-ring group-data-[collapsible=icon]:hidden"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <HugeiconsIcon className="size-5 text-foreground" icon={Home01Icon} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-foreground text-sm">Federação Sergipana</span>
            <span className="block truncate text-muted-foreground text-xs">Ver o site</span>
          </span>
          <HugeiconsIcon className="size-4 shrink-0 text-muted-foreground" icon={ArrowUpRight01Icon} strokeWidth={2} />
        </Link>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        <SidebarGroup className="px-3 py-1 group-data-[collapsible=icon]:px-0">
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            {collapsed
              ? leafItems().map((leaf) => (
                  <SidebarMenuItem key={leaf.to}>
                    <SidebarMenuButton
                      className={MENU_BUTTON}
                      isActive={isNavActive(pathname, leaf.to)}
                      tooltip={leaf.label}
                      render={
                        <Link
                          to={leaf.to}
                          aria-label={leaf.to === REQUESTS_PATH && pending > 0 ? `${leaf.label}, ${pending} pending` : leaf.label}
                        >
                          <span className="relative">
                            <HugeiconsIcon icon={leaf.icon} strokeWidth={2} />
                            {leaf.to === REQUESTS_PATH && pending > 0 ? (
                              <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-warning" />
                            ) : null}
                          </span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))
              : main.map(renderEntry)}
          </SidebarMenu>
        </SidebarGroup>
        {!collapsed && secondary.length > 0 ? (
          <>
            <hr className="mx-3 my-2 text-border" />
            <SidebarGroup className="px-3 py-1">
              <SidebarMenu>
                {secondary.map(renderEntry)}
              </SidebarMenu>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        {user ? <UserMenu user={user} /> : <Skeleton className="h-12 w-full rounded-lg" />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function UserMenu({ user }: { user: SidebarUser }) {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();

  const signOut = () =>
    authClient.signOut({
      fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
    });

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={`rounded-lg p-3 text-sm data-open:bg-sidebar-accent ${RAIL_BUTTON} group-data-[collapsible=icon]:p-0!`}
              />
            }
          >
            <Avatar>
              {user.image ? <AvatarImage alt="" src={user.image} /> : null}
              <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate font-semibold text-base group-data-[collapsible=icon]:hidden">
              {user.name}
            </span>
            <HugeiconsIcon
              className="ml-auto group-data-[collapsible=icon]:hidden"
              icon={ArrowDown01Icon}
              strokeWidth={2}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60 rounded-2xl"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
          >
            <div className="px-3 py-2">
              <p className="truncate font-semibold text-base">{user.name}</p>
              <p className="truncate text-muted-foreground text-sm">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/dashboard/user" />}>
              <HugeiconsIcon icon={User02Icon} strokeWidth={2} />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/" />}>
              <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
              Back to site
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
