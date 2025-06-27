"use client"

import { CircuitTableSkeleton } from "./components/circuit-table-skeleton"
import Title from "@/components/ui/title"

const Loading = () => {
	return (
		<div className="flex h-screen max-h-full w-screen max-w-full flex-col items-center justify-center pt-12 pb-20">
			<Title label="Circuitos" />
			<CircuitTableSkeleton />
		</div>
	)
}

export default Loading
