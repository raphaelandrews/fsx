import { MegaphoneIcon } from "lucide-react";
import type { AnnouncementByPage as AnnouncementType } from "@/db/queries";
import { HomeSection } from "@/components/home-section";
import { AnnouncementLink } from "@/components/announcement-link";

interface AnnouncementsSectionProps {
  announcements: AnnouncementType[];
}

export function AnnouncementsSection({
  announcements,
}: AnnouncementsSectionProps) {
  return (
    <HomeSection
      label="Comunicados"
      href={"/comunicados"}
      icon={MegaphoneIcon}
      main={false}
    >
      <div className="grid md:grid-cols-2 gap-1.5">
        {announcements?.map((announcement: AnnouncementType) => (
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
  );
}
