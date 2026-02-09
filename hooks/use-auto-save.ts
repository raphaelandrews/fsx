"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useDebounce } from "./use-debounce"

export type SaveStatus = "idle" | "saving" | "saved"

interface DraftData {
	title: string
	slug: string
	content: string
	image: string
	savedAt: number
}

interface UseAutoSaveOptions {
	postId: string
	data: {
		title: string
		slug: string
		content: string
		image: string
	}
	dbUpdatedAt?: Date | null
	delay?: number
}

interface UseAutoSaveReturn {
	saveStatus: SaveStatus
	hasDraft: boolean
	draftData: DraftData | null
	restoreDraft: () => DraftData | null
	clearDraft: () => void
	dismissDraft: () => void
}

const STORAGE_KEY_PREFIX = "post-draft-"

function getStorageKey(postId: string): string {
	return `${STORAGE_KEY_PREFIX}${postId}`
}

export function useAutoSave({
	postId,
	data,
	dbUpdatedAt,
	delay = 3000,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
	const [hasDraft, setHasDraft] = useState(false)
	const [draftData, setDraftData] = useState<DraftData | null>(null)
	const isInitialMount = useRef(true)
	const previousDataRef = useRef(data)

	const debouncedData = useDebounce(data, delay)

	// Check for existing draft on mount
	useEffect(() => {
		const storageKey = getStorageKey(postId)
		const saved = localStorage.getItem(storageKey)

		if (saved) {
			try {
				const parsed: DraftData = JSON.parse(saved)
				const dbTime = dbUpdatedAt ? new Date(dbUpdatedAt).getTime() : 0

				// Only show draft if it's newer than DB
				if (parsed.savedAt > dbTime) {
					setDraftData(parsed)
					setHasDraft(true)
				} else {
					// Draft is older than DB, remove it
					localStorage.removeItem(storageKey)
				}
			} catch {
				localStorage.removeItem(storageKey)
			}
		}
	}, [postId, dbUpdatedAt])

	// Save draft when debounced data changes
	useEffect(() => {
		// Skip initial mount
		if (isInitialMount.current) {
			isInitialMount.current = false
			previousDataRef.current = debouncedData
			return
		}

		// Check if data actually changed
		const prev = previousDataRef.current
		const hasChanges =
			prev.title !== debouncedData.title ||
			prev.slug !== debouncedData.slug ||
			prev.content !== debouncedData.content ||
			prev.image !== debouncedData.image

		if (!hasChanges) return

		previousDataRef.current = debouncedData

		setSaveStatus("saving")

		const draft: DraftData = {
			...debouncedData,
			savedAt: Date.now(),
		}

		const storageKey = getStorageKey(postId)
		localStorage.setItem(storageKey, JSON.stringify(draft))

		setSaveStatus("saved")

		// Reset to idle after 2 seconds
		const timer = setTimeout(() => {
			setSaveStatus("idle")
		}, 2000)

		return () => clearTimeout(timer)
	}, [debouncedData, postId])

	const restoreDraft = useCallback((): DraftData | null => {
		if (draftData) {
			setHasDraft(false)
			return draftData
		}
		return null
	}, [draftData])

	const clearDraft = useCallback(() => {
		const storageKey = getStorageKey(postId)
		localStorage.removeItem(storageKey)
		setHasDraft(false)
		setDraftData(null)
	}, [postId])

	const dismissDraft = useCallback(() => {
		clearDraft()
	}, [clearDraft])

	return {
		saveStatus,
		hasDraft,
		draftData,
		restoreDraft,
		clearDraft,
		dismissDraft,
	}
}
