"use client"

import React from "react"
import MDEditor from "@uiw/react-md-editor"

interface MDXEditorProps {
	content: string
	onChange: (content: string) => void
}

const MDXEditor = ({ content, onChange }: MDXEditorProps) => {
	const [value, setValue] = React.useState<string>(content)

	React.useEffect(() => {
		setValue(content)
	}, [content])

	const handleEditorChange = (newValue: string | undefined) => {
		if (typeof newValue === "string") {
			setValue(newValue)
			onChange(newValue)
		}
	}

	return (
		<>
			<MDEditor onChange={handleEditorChange} value={value} />
			<MDEditor.Markdown source={value} style={{ whiteSpace: "pre-wrap" }} />
		</>
	)
}

export default MDXEditor
