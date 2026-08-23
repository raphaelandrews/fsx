import { useMemo } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CrownIcon, Flag01Icon } from "@hugeicons/core-free-icons";

import type { AppRouter } from "@fsx/api/routers/index";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@fsx/ui/components/avatar";
import { Separator } from "@fsx/ui/components/separator";

import { Announcement } from "@/components/announcement";
import { PageHeader } from "@/components/page-header";
import { getGradient } from "@/lib/gradients";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/membros")({
  head: () => ({
    meta: [
      { title: "Membros - FSX" },
      {
        name: "description",
        content:
          "Diretoria e árbitros da Federação Sergipana de Xadrez.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.roles.listWithPlayers.queryOptions()
    ),
  component: RouteComponent,
});

type RolesWithPlayers = inferRouterOutputs<AppRouter>["roles"]["listWithPlayers"];

interface Member {
  id: number;
  name: string;
  imageUrl: string | null;
  role: string;
}

function flattenMembers(
  roles: RolesWithPlayers,
  type: "management" | "referee"
): Member[] {
  const members = roles
    .filter((r) => r.type === type)
    .flatMap((role) =>
      role.playersToRoles.map((pr) => ({
        id: pr.player.id,
        name: pr.player.name,
        imageUrl: pr.player.imageUrl,
        role: role.name,
      }))
    );

  if (type === "management") {
    return members.sort(
      (a, b) =>
        roleOrderIndex(DIRETORIA_ROLE_ORDER, a.role) -
          roleOrderIndex(DIRETORIA_ROLE_ORDER, b.role) ||
        a.name.localeCompare(b.name, "pt-BR")
    );
  }

  return members.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

const REFEREE_ROLE_ORDER = ["Árbitro Nacional", "Árbitro Auxiliar", "Árbitro Estadual"];

const DIRETORIA_ROLE_ORDER = [
  "Presidente",
  "Vice-Presidente",
  "Vice-Presidente Financeiro",
  "Vice-Presidente Técnico",
  "Vice-Presidente Administrativo",
];

function roleOrderIndex(order: readonly string[], name: string): number {
  const lower = name.toLowerCase();
  const index = order.findIndex((entry) => lower === entry.toLowerCase());
  return index === -1 ? order.length : index;
}

function groupRefereeRoles(
  roles: RolesWithPlayers
): { name: string; members: Member[] }[] {
  return roles
    .filter((r) => r.type === "referee" && r.playersToRoles.length > 0)
    .map((role) => ({
      name: role.name,
      members: role.playersToRoles
        .map((pr) => ({
          id: pr.player.id,
          name: pr.player.name,
          imageUrl: pr.player.imageUrl,
          role: role.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    }))
    .sort(
      (a, b) =>
        roleOrderIndex(REFEREE_ROLE_ORDER, a.name) -
          roleOrderIndex(REFEREE_ROLE_ORDER, b.name) ||
        a.name.localeCompare(b.name, "pt-BR")
    );
}

function RouteComponent() {
  const trpc = useTRPC();
  const { data: roles = [] } = useSuspenseQuery(
    trpc.roles.listWithPlayers.queryOptions()
  );

  const diretoria = useMemo(() => flattenMembers(roles, "management"), [roles]);
  const refereeGroups = useMemo(() => groupRefereeRoles(roles), [roles]);

  return (
    <>
      <PageHeader
        title="Membros"
        description="Diretoria e árbitros da Federação Sergipana de Xadrez."
      />

      <section className="mb-10">
        <Announcement label="Diretoria" icon={CrownIcon} />
        {diretoria.length === 0 ? (
          <EmptyState message="Nenhum membro da diretoria cadastrado." />
        ) : (
          <MemberList members={diretoria} />
        )}
      </section>

      <section>
        <Announcement label="Árbitros" icon={Flag01Icon} />
        {refereeGroups.length === 0 ? (
          <EmptyState message="Nenhum árbitro cadastrado." />
        ) : (
          <div className="flex flex-col gap-6">
            {refereeGroups.map((group) => (
              <div key={group.name} className="flex flex-col">
                <Separator />
                <h3 className="p-3 text-sm font-semibold text-muted-foreground">
                  {group.name}
                </h3>
                <MemberList members={group.members} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-3 text-sm text-muted-foreground">{message}</p>
  );
}

function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="flex flex-col">
      {members.map((member, index) => (
        <MemberCard
          key={member.id}
          member={member}
          isLast={index === members.length - 1}
        />
      ))}
    </div>
  );
}

function MemberCard({
  member,
  isLast,
}: {
  member: Member;
  isLast: boolean;
}) {
  const gradient = getGradient(member.id);
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div>
      <div className="group flex items-center gap-4 p-3 transition-colors duration-300 hover:bg-muted/50">
        <Avatar className="size-12">
          <AvatarImage alt={member.name} src={member.imageUrl ?? undefined} />
          <AvatarFallback style={gradient}>
            {initials ? (
              <span className="text-xs font-bold uppercase text-white/90">
                {initials}
              </span>
            ) : null}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold leading-tight">
            {member.name}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {member.role}
          </span>
        </div>
      </div>
      {!isLast ? <Separator /> : null}
    </div>
  );
}
