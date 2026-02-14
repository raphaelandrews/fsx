import type { Metadata } from "next";
import { ScrollIcon } from "lucide-react";
import React, { Suspense } from "react";

import { getPlayersRoles } from "@/db/queries";
import { siteConfig } from "@/lib/site";

import { Client } from "./client";
import { MembrosSkeleton } from "./components/membros-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { DottedX } from "@/components/dotted-x";

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
		<>
			<PageHeader icon={ScrollIcon} label="Membros">
				<DottedX className="p-0">
					<Suspense fallback={<MembrosSkeleton />}>
						<MembrosContent />
					</Suspense>
				</DottedX>
			</PageHeader>
		</>
	);
}
