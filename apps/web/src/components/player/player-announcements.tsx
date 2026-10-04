import { Link } from "@tanstack/react-router";

import { padNumber } from "@/utils/format";

export function PlayerAnnouncements({
  announcements,
}: {
  announcements: { id: number; year: number; number: number; excerpt: string }[];
}) {
  if (announcements.length === 0) return null;
  return (
    <ul className="divide-y px-2 sm:px-4">
      {announcements.map((announcement) => (
        <li key={announcement.id} className="py-3">
          <Link
            to="/comunicados/$id"
            params={{ id: announcement.id }}
            className="font-medium text-sm hover:underline"
          >
            Comunicado {padNumber(announcement.number)}/{announcement.year}
          </Link>
          <p className="line-clamp-2 text-muted-foreground text-xs">{announcement.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
