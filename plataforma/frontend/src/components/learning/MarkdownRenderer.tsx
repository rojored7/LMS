/**
 * MarkdownRenderer Component
 * Renders markdown content with syntax highlighting
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import VideoEmbed from '../common/VideoEmbed';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Helper function to check if a string is a video URL
function isVideoUrl(text: string): boolean {
  if (typeof text !== 'string') return false;

  const videoPatterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
    /^https?:\/\/(www\.)?vimeo\.com/,
  ];

  return videoPatterns.some((pattern) => pattern.test(text.trim()));
}

// Helper function to extract text from React children
function extractTextFromChildren(children: any): string {
  if (typeof children === 'string') {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }

  if (children?.props?.children) {
    return extractTextFromChildren(children.props.children);
  }

  return '';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom rendering for code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="relative">
                <pre className={`${className} rounded-lg p-4 overflow-x-auto`}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className={`${className} bg-gray-100 px-1.5 py-0.5 rounded text-sm`} {...props}>
                {children}
              </code>
            );
          },
          // Custom rendering for links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            );
          },
          // Custom rendering for tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full divide-y divide-gray-300">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-gray-50">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>;
          },
          tr({ children }) {
            return <tr>{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{children}</td>
            );
          },
          // Custom rendering for blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic">
                {children}
              </blockquote>
            );
          },
          // Custom rendering for headings
          h1({ children }) {
            return <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xl font-semibold text-gray-900 mt-5 mb-2">{children}</h3>;
          },
          // Custom rendering for lists
          ul({ children }) {
            return <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-gray-700">{children}</li>;
          },
          // Custom rendering for paragraphs to handle video embeds
          p({ children }) {
            // Check if the paragraph contains only a video URL
            const text = extractTextFromChildren(children);
            if (isVideoUrl(text)) {
              return <VideoEmbed url={text} className="my-6" />;
            }

            return <p className="my-4">{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
