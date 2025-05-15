import { createFileRoute } from "@tanstack/react-router";

import {
  freshAnnouncementsQueryOptions,
  freshNewsQueryOptions,
} from "~/db/queries";

import { AnnouncementsSection } from "~/components/home/announcements-section";
import { DataTableTabs } from "~/components/home/ratings/data-table-tabs";
import { FAQ } from "~/components/home/faq";
import { NewsSection } from "~/components/home/news-section";
import { UpdateRegister } from "~/components/update-register";

export const Route = createFileRoute("/_default/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(freshNewsQueryOptions());
    await queryClient.ensureQueryData(freshAnnouncementsQueryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <UpdateRegister />
      <NewsSection />
      <DataTableTabs />
      <AnnouncementsSection />
      <FAQ />
    </>
  );
}
