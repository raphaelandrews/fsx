import type { Metadata } from "next";
import { CacheInvalidation } from "./components/cache-invalidation";

export const metadata: Metadata = {
	title: "Cache Invalidation",
	description: "Invalidate cached queries",
};

export default function CachePage() {
	return (
		<div className="container max-w-4xl py-8">
			<h1 className="mb-8 font-bold text-2xl">Cache Invalidation</h1>
			<CacheInvalidation />
		</div>
	);
}
