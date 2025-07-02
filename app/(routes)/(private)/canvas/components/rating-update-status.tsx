import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/announcement";

export function RatingUpdateStatus({
  successCount,
  errorCount,
  currentIndex,
  totalUpdates,
}: {
  successCount: number;
  errorCount: number;
  currentIndex: number;
  totalUpdates: number;
}) {
  return (
    <div className="absolute top-4 right-4 flex flex-col items-end gap-4">
      <Announcement>
        <AnnouncementTag className="flex items-center gap-2">
          <span>Success</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
          </span>
        </AnnouncementTag>
        <AnnouncementTitle>{successCount}</AnnouncementTitle>
      </Announcement>
      <Announcement>
        <AnnouncementTag className="flex items-center gap-2">
          <span>Errors</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
        </AnnouncementTag>
        <AnnouncementTitle>{errorCount}</AnnouncementTitle>
      </Announcement>
      <Announcement>
        <AnnouncementTag className="flex items-center gap-2">
          <span>Progress</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
          </span>
        </AnnouncementTag>
        <AnnouncementTitle>
          {currentIndex}/{totalUpdates}
        </AnnouncementTitle>
      </Announcement>
    </div>
  );
}
