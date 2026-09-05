
import { useEffect, useState } from "react";

export function StatusDot({ date }: { date: Date | string }) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!currentDate) return null;

  // date is a date-only "YYYY-MM-DD" string (no time). Compare by calendar
  // day, not by time-of-day, so the dot doesn't flip a day early/late.
  // "today" is resolved in America/Sao_Paulo to match the site's audience.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(currentDate);

  const eventDateStr = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  const daysDifference = Math.round(
    (new Date(eventDateStr + "T00:00:00Z").getTime() -
      new Date(today + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysDifference < 0) {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
      </span>
    );
  }

  if (daysDifference <= 7) {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
      </span>
    );
  }

  if (daysDifference <= 14) {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
      </span>
    );
  }

  return null;
}
