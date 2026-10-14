import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"

import { parseDbTimestamp } from "@/utils/format";

const TIME_ZONE = "America/Sao_Paulo";

const dayParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function calendarDay(date: Date) {
  const [year = 0, month = 0, day = 0] = dayParts.format(date).split("-").map(Number);
  return { year, month, day, ordinal: Date.UTC(year, month - 1, day) / 86_400_000 };
}

function elapsedLabel(target: Date, now: Date) {
  const from = calendarDay(target);
  const to = calendarDay(now);
  let months = (to.year - from.year) * 12 + (to.month - from.month);
  if (to.day < from.day) months--;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0) {
    const label = `${years} ano${years > 1 ? "s" : ""}`;
    return remainingMonths > 0
      ? `${label} e ${remainingMonths} ${remainingMonths > 1 ? "meses" : "mês"}`
      : label;
  }
  if (months > 0) return `${months} ${months > 1 ? "meses" : "mês"}`;
  const days = to.ordinal - from.ordinal;
  return days > 0 ? `${days} dia${days > 1 ? "s" : ""}` : "Hoje";
}

function PostDate({ date, elapsed }: { date: Date; elapsed: string }) {
  const fullDate = date.toLocaleString("pt-BR", {
    timeZone: TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <>
      <p className="flex items-center gap-2">
        <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
        <span className="mt-[1px]">{fullDate}</span>
      </p>
      <div className="h-1 w-1 rounded-full bg-muted-foreground" />
      <p>{elapsed}</p>
    </>
  )
}

export function PostTimeAgo({ date }: { date: Date | string }) {
  const [now, setNow] = useState<Date | null>(null);
  const target = useMemo(() => parseDbTimestamp(date), [date]);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return <PostDate date={target} elapsed={now ? elapsedLabel(target, now) : "..."} />;
}
