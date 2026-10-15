"use client";

import { useEffect, useState } from "react";

export function StatusDot({ date }: { date: Date | string }) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!currentDate) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const timeDifference = dateObj.getTime() - currentDate.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

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
