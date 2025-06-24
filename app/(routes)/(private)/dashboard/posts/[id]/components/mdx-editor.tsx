"use client"

import React, { useEffect, useState } from "react";
import MDEditor from '@uiw/react-md-editor';

interface MDXEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MDXEditor = ({ content, onChange }: MDXEditorProps) => {
  const [value, setValue] = useState<string>(content);

  useEffect(() => {
    setValue(content);
  }, [content]);

  const handleEditorChange = (newValue: string | undefined) => {
    if (typeof newValue === 'string') {
      setValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <>
      <MDEditor
        value={value}
        onChange={handleEditorChange} 
      />
      <MDEditor.Markdown source={value} style={{ whiteSpace: 'pre-wrap' }} />
    </>
  );
}

export default MDXEditor;

