"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	DatabaseIcon,
	CheckCircleIcon,
	PlayIcon,
	RotateCcwIcon,
	AlertTriangleIcon,
	DatabaseZapIcon,
	LoaderCircleIcon,
	AlertCircleIcon,
} from "lucide-react"

import { type DatabaseUpdateProps, mockResponses, mockUpdates } from "./data"
import { MotionGridShowcase } from "./motion-grid-showcase"

import { ManagementBar } from "@/components/showcase/management-bar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DatabaseUpdate() {
	const [currentUpdate, setCurrentUpdate] =
		useState<DatabaseUpdateProps | null>(null)
	const [errorStack, setErrorStack] = useState<DatabaseUpdateProps[]>([])
	const [successCount, setSuccessCount] = useState(0)
	const [errorCount, setErrorCount] = useState(0)
	const [isRunning, setIsRunning] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	const startAnimation = () => {
		setCurrentUpdate(null)
		setErrorStack([])
		setSuccessCount(0)
		setErrorCount(0)
		setCurrentIndex(0)
		setIsRunning(true)

		// Start with the first update
		const firstUpdate = {
			...mockUpdates[0],
			status: "pending" as const,
		}
		setCurrentUpdate(firstUpdate)
	}

	const reset = () => {
		setCurrentUpdate(null)
		setErrorStack([])
		setSuccessCount(0)
		setErrorCount(0)
		setCurrentIndex(0)
		setIsRunning(false)
	}

	useEffect(() => {
		if (!(isRunning && currentUpdate)) return

		const timer = setTimeout(
			() => {
				const isSuccess = Math.random() > 0.4 // 60% success rate
				const duration = Math.floor(Math.random() * 2000) + 500

				if (isSuccess) {
					// Success: increment counter and move to next
					setSuccessCount((prev) => prev + 1)
					setCurrentUpdate(null)

					// Move to next update
					const nextIndex = currentIndex + 1
					if (nextIndex < mockUpdates.length) {
						setTimeout(() => {
							const nextUpdate = {
								...mockUpdates[nextIndex],
								status: "pending" as const,
							}
							setCurrentUpdate(nextUpdate)
							setCurrentIndex(nextIndex)
						}, 500)
					} else {
						setIsRunning(false)
					}
				} else {
					// Error: add to error stack and move to next
					const errorUpdate = {
						...currentUpdate,
						status: "error" as const,
						error:
							mockResponses.errors[
								Math.floor(Math.random() * mockResponses.errors.length)
							],
						duration,
					}

					setErrorStack((prev) => [errorUpdate, ...prev])
					setErrorCount((prev) => prev + 1)
					setCurrentUpdate(null)

					// Move to next update
					const nextIndex = currentIndex + 1
					if (nextIndex < mockUpdates.length) {
						setTimeout(() => {
							const nextUpdate = {
								...mockUpdates[nextIndex],
								status: "pending" as const,
							}
							setCurrentUpdate(nextUpdate)
							setCurrentIndex(nextIndex)
						}, 800)
					} else {
						setIsRunning(false)
					}
				}
			},
			Math.random() * 2000 + 1500
		)

		return () => clearTimeout(timer)
	}, [isRunning, currentUpdate, currentIndex])

	return (
		<div className="min-h-screen bg-background p-6">
			<ManagementBar />
			<div className="mx-auto max-w-6xl">
				<div className="mb-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
								<DatabaseIcon className="size-4 text-accent-foreground " />
							</div>
							<div>
								<h1 className="font-semibold text-foreground text-xl">
									Database Update Process
								</h1>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="flex items-center gap-6 text-sm">
								<div className="flex items-center gap-2">
									<div className="h-3 w-3 rounded-full bg-green-500" />
									<span className="font-medium text-gray-600">
										Success: {successCount}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="h-3 w-3 rounded-full bg-red-500" />
									<span className="font-medium text-gray-600">
										Errors: {errorCount}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="text-gray-600">
										Progress: {currentIndex + (currentUpdate ? 1 : 0)}/
										{mockUpdates.length}
									</div>
								</div>
							</div>

							<div className="flex gap-2">
								<Button disabled={isRunning} onClick={startAnimation} size="sm">
									<PlayIcon className="mr-2 h-4 w-4" />
									Run Process
								</Button>
								<Button onClick={reset} size="sm" variant="outline">
									<RotateCcwIcon className="mr-2 h-4 w-4" />
									Reset
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div
					className="relative h-fit min-h-96 pt-8"
					style={{
						backgroundImage:
							"radial-gradient(circle, var(--muted) 2px, transparent 2px)",
						backgroundSize: "20px 20px",
						backgroundPosition: "0 0, 10px 10px",
					}}
				>
					<div className="relative z-10">
						{!(currentUpdate || isRunning) && (
							<div className="mt-4 flex justify-center">
								<Alert className="w-fit">
									<DatabaseZapIcon />
									<AlertTitle>Run to start database operations.</AlertTitle>
								</Alert>
							</div>
						)}

						{isRunning && (
							<div className="mt-4 flex justify-center">
								<MotionGridShowcase />
							</div>
						)}

						{!currentUpdate && isRunning && (
							<div className="mt-4 flex justify-center">
								<Alert className="w-fit">
									<CheckCircleIcon />
									<AlertTitle>Completed</AlertTitle>
								</Alert>
							</div>
						)}
					</div>

					<AnimatePresence mode="wait">
						{currentUpdate && (
							<div className="mt-4 flex justify-center">
								<motion.div
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95, y: -20 }}
									initial={{ opacity: 0, scale: 0.95, y: 20 }}
									key={currentUpdate.id}
									transition={{ duration: 0.4 }}
								>
									<Alert>
										<LoaderCircleIcon />
										<AlertTitle>{currentUpdate.operation}</AlertTitle>
										<AlertDescription>
											{currentUpdate.description}

											<div className="flex items-center justify-center gap-2">
												<Badge
													className="bg-gray-100 text-gray-700"
													variant="secondary"
												>
													{currentUpdate.table}
												</Badge>
												<Badge className="bg-blue-100 text-blue-700">
													Processing
												</Badge>
											</div>
										</AlertDescription>
									</Alert>
								</motion.div>
							</div>
						)}
					</AnimatePresence>

					{errorStack.length > 0 && (
						<div className=" relative mt-4 flex justify-center">
							<div className="relative z-10 space-y-4">
								<div className="mb-4 flex items-center gap-2">
									<AlertTriangleIcon className="h-5 w-5 text-red-600" />
									<h2 className="font-semibold text-gray-900 text-lg">
										Failed Operations
									</h2>
									<Badge className="bg-red-100 text-red-800">
										{errorStack.length}
									</Badge>
								</div>

								<AnimatePresence>
									{errorStack.map((update, index) => (
										<motion.div
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 20 }}
											initial={{ opacity: 0, x: -20 }}
											key={update.id}
											transition={{ duration: 0.3, delay: index * 0.1 }}
										>
											<Alert variant="destructive">
												<AlertCircleIcon />
												<AlertTitle>{update.operation}</AlertTitle>
												<AlertDescription>
													<p>{update.description}</p>

													{update.error && (
														<div className="rounded-lg border border-red-200 bg-red-100 p-3">
															<div className="mb-2 font-medium text-red-800 text-sm">
																{update.error.message}
															</div>
															<details className="group">
																<summary className="cursor-pointer text-red-600 text-xs hover:text-red-700">
																	View stack trace
																</summary>
																<pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-red-200 p-2 text-red-600 text-xs">
																	{update.error.stack}
																</pre>
															</details>
														</div>
													)}
												</AlertDescription>
											</Alert>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
