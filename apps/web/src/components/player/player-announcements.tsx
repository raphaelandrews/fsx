import { AnnouncementRow } from "@/components/announcement-row";

export function PlayerAnnouncements({
  announcements,
}: {
  announcements: { id: number; year: number; number: number; excerpt: string }[];
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
