/**
 * MarkdownRenderer Component
 * Renders markdown content with syntax highlighting
 */

import { useState, useEffect } from 'react';
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

/**
 * Carga una imagen que requiere autenticacion usando fetch con credenciales.
 *
 * El endpoint GET /api/uploads/* requiere auth via cookies HttpOnly.
 * El tag <img> nativo del navegador no envia esas cookies en cross-origin dev.
 * Solucion: fetch con credentials:'include' obtiene el blob, se convierte a
 * un Blob URL local que el <img> puede cargar sin restricciones de auth.
 *
 * Para URLs externas (no /api/uploads/) se devuelve el src original sin modificar.
 */
function useAuthenticatedImage(src: string | undefined): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(src);

  useEffect(() => {
    if (!src || !src.startsWith('/api/uploads/')) {
      setResolved(src);
      return;
    }

    let cancelled = false;
    let objectUrl: string | undefined;

    fetch(src, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolved(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setResolved(undefined);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolved;
}

/**
 * Componente que renderiza imagenes del backend con autenticacion.
 * Se define fuera de MarkdownRenderer para que ESLint reconozca los hooks
 * (el nombre en uppercase indica que es un componente React valido).
 */
function AuthenticatedImage({ src, alt }: { src?: string; alt?: string }) {
  const imgSrc = useAuthenticatedImage(src);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <span className="text-sm text-gray-400 italic">[imagen no disponible]</span>;
  }

  if (!imgSrc) {
    return (
      <span className="inline-flex items-center justify-center w-full my-4 py-4 bg-gray-100 rounded-lg text-gray-400 text-sm">
        Cargando imagen...
      </span>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      loading="lazy"
      className="max-w-full h-auto rounded-lg my-4 shadow-sm"
      onError={() => setHasError(true)}
    />
  );
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
          // Delega a AuthenticatedImage (componente React uppercase) para
          // cumplir con react-hooks/rules-of-hooks.
          img({ src, alt }) {
            return <AuthenticatedImage src={src} alt={alt} />;
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
