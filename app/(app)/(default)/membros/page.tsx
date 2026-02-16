import type { Metadata } from "next";
import { ScrollIcon } from "lucide-react";
import React, { Suspense } from "react";

import { getPlayersRoles } from "@/db/queries";
import { siteConfig } from "@/lib/site";

import { Client } from "./client";
import { MembrosSkeleton } from "./components/membros-skeleton";
import { PageWrapper } from "@/components/ui/page-wrapper";

export const metadata: Metadata = {
	title: "Membros",
	description: "Diretoria e árbitros da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/membros`,
		title: "Membros",
		description: "Diretoria e árbitros da Federação Sergipana de Xadrez.",
		siteName: "Membros",
	},
};

async function MembrosContent() {
	const data = await getPlayersRoles();
	return <Client roles={data} />;
}

export default function Page() {
	return (
		<PageWrapper icon={ScrollIcon} label="Membros">
			<Suspense fallback={<MembrosSkeleton />}>
				<MembrosContent />
			</Suspense>
		</PageWrapper>
	);
}
