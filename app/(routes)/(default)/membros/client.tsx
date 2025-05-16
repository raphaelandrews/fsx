"use client";

import { useMemo } from "react";

import type { PlayerToRole } from "@/db/queries";
import { getGradient } from "@/lib/generate-gradients";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Client({ roles }: { roles: PlayerToRole[] }) {
  const management = useMemo(() => {
    return roles.filter((role) => role.type === "management");
  }, [roles]);

  const referee = useMemo(() => {
    return roles
      .filter(
        (role) =>
          role.type === "referee" && (role.playersToRoles?.length ?? 0) > 0
      )
      .reverse();
  }, [roles]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold leading-none tracking-tight">Diretoria</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
          {management.map((item, index) => {
            if (!item.playersToRoles?.length) return null;
            const gradient = getGradient(index);
            return (
              <Card
                key={item.role}
                className="bg-card hover:bg-accent rounded-lg transition-all hover:cursor-pointer"
              >
                <CardContent className="flex items-center space-x-3 p-3 text-sm">
                  {item.playersToRoles?.map((member) => (
                    <Avatar key={`${item.role}-${member.player.id}`}>
                      <AvatarImage
                        src={member.player.imageUrl || undefined}
                        alt={member.player.name}
                        title={member.player.name}
                      />
                      <AvatarFallback style={gradient} />
                    </Avatar>
                  ))}
                  <div className="mt-1">
                    {item.playersToRoles?.map((member) => (
                      <p
                        key={`${item.role}-${member.player.id}-name`}
                        className="font-medium leading-none line-clamp-1 webkit-line-clamp-1"
                      >
                        {member.player.name}
                      </p>
                    ))}
                    <p className="text-muted-foreground line-clamp-1 webkit-line-clamp-1">
                      {item.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="font-semibold leading-none tracking-tight">Árbitros</h2>
        <div className="flex flex-col gap-3 mt-1">
          {referee.map((item) => {
            if (!item.playersToRoles?.length) return null;
            return (
              <div key={item.role} className="mt-3">
                <h3 className="font-medium text-sm leading-none tracking-tight">
                  {item.role}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
                  {item.playersToRoles?.map((member) => {
                    const gradient = getGradient(member.player.id);
                    return (
                      <Card
                        key={`${item.role}-${member.player.id}`}
                        className="bg-card hover:bg-accent rounded-lg transition-all hover:cursor-pointer"
                      >
                        <CardContent className="flex items-center space-x-3 p-3 text-sm">
                          <Avatar>
                            <AvatarImage
                              src={member.player.imageUrl || undefined}
                              alt={member.player.name}
                              title={member.player.name}
                            />
                            <AvatarFallback style={gradient} />
                          </Avatar>
                          <div className="mt-1">
                            <p className="font-medium leading-none line-clamp-1 webkit-line-clamp-1">
                              {member.player.name}
                            </p>
                            <p className="text-muted-foreground line-clamp-1 webkit-line-clamp-1">
                              {item.role}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
