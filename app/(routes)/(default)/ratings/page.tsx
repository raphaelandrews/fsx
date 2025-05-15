import { BarChart2Icon } from "lucide-react";

import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import { getPlayersByPage } from "@/db/queries";
import { RatingsTables } from "./ratings-tables";

export interface PlayersFilters {
  page?: number;
  limit?: number;
  sortBy?: "rapid" | "blitz" | "classic";
  sex?: boolean;
  titles?: string[];
  clubs?: string[];
  groups?: string[];
  locations?: string[];
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;

  const resolvedSearchParams = {
    sortBy: resolvedParams.sortBy || "rapid",
    limit: Number(resolvedParams.limit) || 20,
    page: Number(resolvedParams.page) || 1,
    sex:
      resolvedParams.sex === "true"
        ? true
        : resolvedParams.sex === "false"
        ? false
        : undefined,
    titles: Array.isArray(resolvedParams.title)
      ? resolvedParams.title
      : [resolvedParams.title].filter(Boolean),
    clubs: Array.isArray(resolvedParams.club)
      ? resolvedParams.club
      : [resolvedParams.club].filter(Boolean),
    groups: Array.isArray(resolvedParams.group)
      ? resolvedParams.group
      : [resolvedParams.group].filter(Boolean),
    locations: Array.isArray(resolvedParams.location)
      ? resolvedParams.location
      : [resolvedParams.location].filter(Boolean),
  };

  const filters: PlayersFilters = {
    page: resolvedSearchParams.page,
    limit: resolvedSearchParams.limit,
    sortBy: resolvedSearchParams.sortBy as "classic" | "rapid" | "blitz",
    sex: resolvedSearchParams.sex,
    titles: resolvedSearchParams.titles.filter(
      (title): title is string => title !== undefined
    ),
    clubs: resolvedSearchParams.clubs.filter(
      (club): club is string => club !== undefined
    ),
    groups: resolvedSearchParams.groups.filter(
      (group): group is string => group !== undefined
    ),
    locations: resolvedSearchParams.locations.filter(
      (location): location is string => location !== undefined
    ),
  };

  const { players, pagination } = await getPlayersByPage(filters);

  return (
    <>
      <PageHeader>
        <Announcement icon={BarChart2Icon} />
        <PageHeaderHeading>Ratings</PageHeaderHeading>
        <PageHeaderDescription>
          Confira as tabelas de rating.
        </PageHeaderDescription>
      </PageHeader>

      <RatingsTables players={players} pagination={pagination} />
    </>
  );
}
