import { BarChart2Icon } from "lucide-react";

import { Announcement } from "@/components/announcement";
import { DataTableSkeletonRow } from "@/components/players-table/data-table-skeleton";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

export default function Loading() {
  return (
    <>
      <PageHeader>
        <Announcement icon={BarChart2Icon} />
        <PageHeaderHeading>Ratings</PageHeaderHeading>
        <PageHeaderDescription>
          Confira as tabelas de rating.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mt-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        </div>
        <table>
          <thead>
            <tr>
              <th className="p-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </th>
              <th className="p-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </th>
              <th className="p-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </th>
            </tr>
            *
          </thead>
          <tbody>
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
          </tbody>
        </table>
      </div>
    </>
  );
}
