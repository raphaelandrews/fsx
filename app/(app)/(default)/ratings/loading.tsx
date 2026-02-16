import { BarChart2Icon, InfoIcon } from "lucide-react";

import { Announcement } from "@/components/announcement";
import { DataTableSkeletonRow } from "@/app/(app)/(default)/ratings/components/data-table-skeleton";
import { PageWrapper, PageHeaderHeading } from "@/components/ui/page-wrapper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTableToolbarSkeleton } from "@/app/(app)/(default)/ratings/components/data-table-toolbar-skeleton";

export default function Loading() {
  return (
    <>
      <PageWrapper>
        <Announcement icon={BarChart2Icon} />
        <PageHeaderHeading>Ratings</PageHeaderHeading>
      </PageWrapper>

      <Tabs>
        <div className="mb-4 flex flex-col items-start gap-3 lg:flex-row lg:items-center">
          <TabsList>
            <TabsTrigger className="w-20 sm:w-24" value="classic">
              Clássico
            </TabsTrigger>
            <TabsTrigger className="w-20 sm:w-24" value="rapid">
              Rápido
            </TabsTrigger>
            <TabsTrigger className="w-20 sm:w-24" value="blitz">
              Blitz
            </TabsTrigger>
          </TabsList>
          <InfoIcon className="h-4 w-4 text-primary" />
        </div>

        <DataTableToolbarSkeleton />
        <table className="w-full">
          <tbody>
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
            <DataTableSkeletonRow />
          </tbody>
        </table>
      </Tabs>
    </>
  );
}
