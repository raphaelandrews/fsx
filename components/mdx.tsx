"use client"

import MDEditor from "@uiw/react-md-editor"

interface MDXProps {
	content: string
}

export function MDX({ content }: MDXProps) {
	return (
		<MDEditor.Markdown source={content} style={{ whiteSpace: "pre-wrap" }} />
	)
}
