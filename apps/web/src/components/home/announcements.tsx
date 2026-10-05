import { Megaphone01Icon } from "@hugeicons/core-free-icons";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

import { Section } from "./section";
import { SectionButton } from "@/components/section-button";
import { AnnouncementRow } from "@/components/announcement-row";

type AnnouncementType = inferRouterOutputs<AppRouter>["announcements"]["fresh"][number];

export function Announcements({ announcements }: { announcements: AnnouncementType[] }) {
  return (
    <Section icon={Megaphone01Icon} label="Comunicados" main={false}>
      <ul className="grid md:grid-cols-2">
        {announcements.map((announcement) => (
          <AnnouncementRow
            key={announcement.id}
            announcement={{ ...announcement, excerpt: announcement.content }}
          />
        ))}
      </ul>
      <SectionButton href="/comunicados" label="Ver comunicados" />
    </Section>
  );
}
