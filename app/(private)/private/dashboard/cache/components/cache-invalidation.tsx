"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { revalidateMultipleTagsAction } from "@/app/actions/revalidate-tag";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CACHE_GROUPS = {
	Posts: ["posts", "fresh-posts", "posts-by-page"],
	Announcements: ["announcements", "fresh-announcements", "announcements-by-page"],
	Players: [
		"players",
		"players-list",
		"players-roles",
		"players-with-filters",
		"search-players",
		"titled-players",
		"top-players",
	],
	Other: ["champions", "circuits", "events", "link-groups"],
} as const;

type GroupName = keyof typeof CACHE_GROUPS;

export function CacheInvalidation() {
	const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
	const [isPending, startTransition] = useTransition();

	function toggleTag(tag: string) {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			if (next.has(tag)) {
				next.delete(tag);
			} else {
				next.add(tag);
			}
			return next;
		});
	}

	function selectGroup(group: GroupName) {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			for (const tag of CACHE_GROUPS[group]) {
				next.add(tag);
			}
			return next;
		});
	}

	async function invalidateTags(tags: string[]) {
		if (tags.length === 0) {
			toast.error("No tags selected");
			return;
		}

		startTransition(async () => {
			const result = await revalidateMultipleTagsAction(tags);
			if (result.success) {
				toast.success(result.message);
				setSelectedTags(new Set());
			} else {
				toast.error(result.message);
			}
		});
	}

	function invalidateGroup(group: GroupName) {
		invalidateTags([...CACHE_GROUPS[group]]);
	}

	function invalidateSelected() {
		invalidateTags([...selectedTags]);
	}

	return (
		<div className="space-y-6">
			{(Object.keys(CACHE_GROUPS) as GroupName[]).map((group) => (
				<div
					key={group}
					className="rounded-lg border bg-card p-4"
				>
					<div className="mb-3 flex items-center justify-between">
						<h2 className="font-semibold text-lg">{group}</h2>
						<Button
							variant="outline"
							size="sm"
							onClick={() => invalidateGroup(group)}
							disabled={isPending}
						>
							Invalidate Group
						</Button>
					</div>
					<div className="flex flex-wrap gap-4">
						{CACHE_GROUPS[group].map((tag) => (
							<Label
								key={tag}
								className="flex cursor-pointer items-center gap-2"
							>
								<input
									type="checkbox"
									checked={selectedTags.has(tag)}
									onChange={() => toggleTag(tag)}
									disabled={isPending}
									className="h-4 w-4 rounded border-gray-300 accent-primary"
								/>
								<span className="text-sm">{tag}</span>
							</Label>
						))}
					</div>
				</div>
			))}

			<div className="flex justify-end gap-2">
				<Button
					variant="outline"
					onClick={() => {
						for (const group of Object.keys(CACHE_GROUPS) as GroupName[]) {
							selectGroup(group);
						}
					}}
					disabled={isPending}
				>
					Select All
				</Button>
				<Button
					onClick={invalidateSelected}
					disabled={isPending || selectedTags.size === 0}
				>
					Invalidate Selected ({selectedTags.size})
				</Button>
			</div>
		</div>
	);
}
