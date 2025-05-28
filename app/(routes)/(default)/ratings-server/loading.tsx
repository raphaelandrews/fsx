import { BarChart2Icon, InfoIcon } from "lucide-react";

import { Announcement } from "@/components/announcement";
import { DataTableSkeletonRow } from "@/app/(routes)/(default)/ratings-server/players-table/data-table-skeleton";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTableToolbarSkeleton } from "@/app/(routes)/(default)/ratings-server/players-table/data-table-toolbar-skeleton";

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

      <Tabs>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="classic" className="w-20 sm:w-24">
              Clássico
            </TabsTrigger>
            <TabsTrigger value="rapid" className="w-20 sm:w-24">
              Rápido
            </TabsTrigger>
            <TabsTrigger value="blitz" className="w-20 sm:w-24">
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
