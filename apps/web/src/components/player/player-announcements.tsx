import { AnnouncementRow, type AnnouncementRowData } from "@/components/announcements/announcement-row";

export function PlayerAnnouncements({
  announcements,
}: {
  announcements: AnnouncementRowData[];
}) {
  if (announcements.length === 0) return null;
  return (
    <ul className="flex flex-col pb-2">
      {announcements.map((announcement) => (
        <AnnouncementRow key={announcement.id} announcement={announcement} />
      ))}
    </ul>
  );
}
