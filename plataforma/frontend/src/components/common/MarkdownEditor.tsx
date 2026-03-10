import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  preview?: 'edit' | 'preview' | 'live';
  height?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  preview = 'live',
  height = 400,
  placeholder = 'Escribe tu contenido en Markdown...',
  disabled = false,
  className = '',
  autoFocus = false,
  onImageUpload,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue?: string) => {
    const val = newValue || '';
    setLocalValue(val);
    onChange(val);
  };

  const handleImagePaste = async (dataTransfer: DataTransfer) => {
    const files = dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    if (onImageUpload) {
      try {
        const url = await onImageUpload(file);
        const imageMarkdown = `![${file.name}](${url})`;

        // Insert image at cursor position
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue = localValue.substring(0, start) + imageMarkdown + localValue.substring(end);
          handleChange(newValue);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <div className={`markdown-editor-wrapper ${className}`} data-color-mode="light">
      <MDEditor
        value={localValue}
        onChange={handleChange}
        preview={preview}
        height={height}
        textareaProps={{
          placeholder,
          disabled,
          autoFocus,
        }}
        previewOptions={{
          rehypePlugins: [[rehypeHighlight as any]],
          remarkPlugins: [[remarkGfm]],
        }}
        onPaste={(event) => {
          if (event.clipboardData) {
            handleImagePaste(event.clipboardData);
          }
        }}
        commands={[
          // Default commands will be included
        ]}
      />

      <style jsx global>{`
        .markdown-editor-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
        }

        .markdown-editor-wrapper .w-md-editor {
          background-color: white;
        }

        .markdown-editor-wrapper .w-md-editor.w-md-editor-focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }

        .markdown-editor-wrapper .w-md-editor-toolbar {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .markdown-editor-wrapper .w-md-editor-toolbar button {
          color: #374151;
        }

        .markdown-editor-wrapper .w-md-editor-toolbar button:hover {
          background-color: #e5e7eb;
        }

        .markdown-editor-wrapper .w-md-editor-content {
          background-color: white;
        }

        .markdown-editor-wrapper .w-md-editor-input,
        .markdown-editor-wrapper .w-md-editor-preview {
          background-color: white;
          color: #111827;
          font-size: 14px;
          line-height: 1.6;
        }

        .markdown-editor-wrapper .wmde-markdown {
          background-color: white;
          color: #111827;
        }

        .markdown-editor-wrapper .wmde-markdown h1,
        .markdown-editor-wrapper .wmde-markdown h2,
        .markdown-editor-wrapper .wmde-markdown h3,
        .markdown-editor-wrapper .wmde-markdown h4,
        .markdown-editor-wrapper .wmde-markdown h5,
        .markdown-editor-wrapper .wmde-markdown h6 {
          color: #111827;
          font-weight: 600;
          line-height: 1.25;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }

        .markdown-editor-wrapper .wmde-markdown h1 { font-size: 2em; }
        .markdown-editor-wrapper .wmde-markdown h2 { font-size: 1.5em; }
        .markdown-editor-wrapper .wmde-markdown h3 { font-size: 1.25em; }

        .markdown-editor-wrapper .wmde-markdown code {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        .markdown-editor-wrapper .wmde-markdown pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }

        .markdown-editor-wrapper .wmde-markdown pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
        }

        .markdown-editor-wrapper .wmde-markdown blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin-left: 0;
          color: #6b7280;
        }

        .markdown-editor-wrapper .wmde-markdown a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .markdown-editor-wrapper .wmde-markdown a:hover {
          color: #2563eb;
        }

        .markdown-editor-wrapper .wmde-markdown img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .markdown-editor-wrapper .wmde-markdown table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .markdown-editor-wrapper .wmde-markdown th,
        .markdown-editor-wrapper .wmde-markdown td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 1rem;
          text-align: left;
        }

        .markdown-editor-wrapper .wmde-markdown th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        .markdown-editor-wrapper .wmde-markdown ul,
        .markdown-editor-wrapper .wmde-markdown ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .markdown-editor-wrapper .wmde-markdown li {
          margin: 0.25rem 0;
        }

        .markdown-editor-wrapper .wmde-markdown hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;