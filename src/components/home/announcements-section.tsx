import { useQuery } from "@tanstack/react-query";
import { MegaphoneIcon } from "lucide-react";

import {
  freshAnnouncementsQueryOptions,
  type Announcement as AnnouncementType,
} from "~/db/queries";
import { HomeSection } from "~/components/home/home-section";
import { AnnouncementLink } from "~/components/announcement-link";

export function AnnouncementsSection() {
  const { data, isLoading } = useQuery(freshAnnouncementsQueryOptions());

  return (
    <>
      <HomeSection
        label="Comunicados"
        href={"/comunicados"}
        icon={MegaphoneIcon}
        main={false}
      >
        <div className="grid md:grid-cols-2 gap-1.5">
          {data?.map((announcement: AnnouncementType) => (
            <AnnouncementLink
              key={announcement.number}
              id={announcement.id}
              year={announcement.year}
              number={announcement.number}
              content={announcement.content}
            />
          ))}
        </div>
      </HomeSection>
    </>
  );
}
