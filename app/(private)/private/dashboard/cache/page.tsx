import type { Metadata } from "next";
import { CacheInvalidation } from "./components/cache-invalidation";
import { SequenceReset } from "./components/sequence-reset";

export const metadata: Metadata = {
	title: "Cache Invalidation",
	description: "Invalidate cached queries",
};

export default function CachePage() {
	return (
		<div className="container max-w-4xl py-8 space-y-8">
			<div>
				<h1 className="mb-8 font-bold text-2xl">Cache Invalidation</h1>
				<CacheInvalidation />
			</div>
			<div>
				<h1 className="mb-8 font-bold text-2xl">Database Sequences</h1>
				<SequenceReset />
			</div>
		</div>
	);
}
