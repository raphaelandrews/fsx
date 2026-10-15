"use client"

import { useRouter, useSearchParams } from "next/navigation"
import React from "react"

const PostRefreshOnce = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const search = searchParams.get("search")

	React.useEffect(() => {
		if (search === "refresh") {
			router.replace("/private/dashboard/posts")
			router.refresh()
		}
	}, [search, router])
	return null
}

export default PostRefreshOnce
