import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUpDownIcon,
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

import { ADMIN_NAV, isNavActive } from "@/components/header/admin-nav-data";
import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

const ACTIVE_PILL =
  "data-active:bg-primary data-active:font-semibold data-active:text-primary-foreground data-active:hover:bg-primary-inverse data-active:hover:text-primary-inverse-foreground [&_svg]:size-5";

const RAIL_BUTTON =
  "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl";

const MENU_BUTTON = `h-10 rounded-full px-3 text-base font-semibold ${RAIL_BUTTON} ${ACTIVE_PILL}`;
const SUB_BUTTON = `h-9 rounded-full px-3 text-base font-medium [&>svg]:text-current ${ACTIVE_PILL}`;

function leafItems() {
  return ADMIN_NAV.flatMap((entry) => entry.items ?? [entry]);
}

export type SidebarUser = { name: string; email: string; image?: string | null };

export function AdminSidebar({ user }: { user?: SidebarUser }) {
  const { pathname } = useLocation();
  const { setOpenMobile, state, isMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <Link
            to="/dashboard"
            aria-label="Admin dashboard"
            onClick={closeMobile}
            className="flex h-10 items-center gap-2 rounded-full px-2 outline-none focus-visible:outline-2 focus-visible:outline-ring group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:bg-background group-data-[collapsible=icon]:p-0"
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
                        <Link to={leaf.to} aria-label={leaf.label}>
                          <HugeiconsIcon icon={leaf.icon} strokeWidth={2} />
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))
              : ADMIN_NAV.map((entry) =>
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
                    <HugeiconsIcon
                      className="ml-auto transition-transform duration-200 ease-out group-data-open/collapsible:rotate-180"
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                    />
                  </SidebarMenuButton>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1 mr-0 ml-5 gap-1 pr-0">
                      {entry.items.map((sub) => (
                        <SidebarMenuSubItem key={sub.to}>
                          <SidebarMenuSubButton
                            className={SUB_BUTTON}
                            isActive={isNavActive(pathname, sub.to)}
                            render={
                              <Link to={sub.to} onClick={closeMobile}>
                                <HugeiconsIcon className="size-4" icon={sub.icon} strokeWidth={2} />
                                <span>{sub.label}</span>
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
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        {user ? <UserMenu user={user} /> : <Skeleton className="h-12 w-full rounded-full" />}
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
                className={`rounded-full px-2 data-open:bg-sidebar-accent ${RAIL_BUTTON} group-data-[collapsible=icon]:p-0!`}
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
              icon={ArrowUpDownIcon}
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
