import { createFileRoute } from "@tanstack/react-router";
import { BarChart2Icon } from "lucide-react";
import { Announcement } from "~/components/announcement";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "~/components/ui/page-header";

export const Route = createFileRoute("/rating/")({
  component: RatingIndexComponent,
});

function RatingIndexComponent() {
  return (
    <>
      <PageHeader>
        <Announcement icon={BarChart2Icon} />
        <PageHeaderHeading>Ratings</PageHeaderHeading>
        <PageHeaderDescription>
          Confira as tabelas de rating.
        </PageHeaderDescription>
      </PageHeader>

     
    </>
  );
}
