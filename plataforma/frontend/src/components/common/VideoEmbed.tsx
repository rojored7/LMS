import { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export default function VideoEmbed({
  url,
  title = 'Video',
  className = '',
  autoplay = false,
  controls = true,
  muted = false,
  aspectRatio = '16:9'
}: VideoEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const embedData = getEmbedData(url);

  if (!embedData) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">URL de video no soportada</p>
            <p className="text-red-600 text-sm mt-1">{url}</p>
            <p className="text-gray-600 text-sm mt-2">
              Formatos soportados: YouTube, Vimeo, Loom, Google Drive
            </p>
          </div>
        </div>
      </div>
    );
  }

  const aspectRatioMap = {
    '16:9': '56.25%',
    '4:3': '75%',
    '1:1': '100%'
  };

  const paddingBottom = aspectRatioMap[aspectRatio];

  return (
    <div className={`video-embed-container ${className}`}>
      <div
        className="relative w-full rounded-lg overflow-hidden bg-gray-900"
        style={{ paddingBottom }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white">Cargando video...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="mb-2">Error al cargar el video</p>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!hasError && (
          <iframe
            src={embedData.url}
            title={title}
            frameBorder="0"
            allow={`${autoplay ? 'autoplay;' : ''} accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen`}
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>

      {/* Video metadata */}
      {embedData.provider && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <Play className="w-4 h-4" />
          <span>{embedData.provider}</span>
          {title && title !== 'Video' && (
            <>
              <span>•</span>
              <span>{title}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface EmbedData {
  url: string;
  provider: string;
}

function getEmbedData(url: string): EmbedData | null {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      url: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
      provider: 'YouTube'
    };
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return {
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
      provider: 'Vimeo'
    };
  }

  // Loom
  const loomRegex = /(?:loom\.com\/share\/)([a-zA-Z0-9]+)/;
  const loomMatch = url.match(loomRegex);
  if (loomMatch) {
    return {
      url: `https://www.loom.com/embed/${loomMatch[1]}`,
      provider: 'Loom'
    };
  }

  // Google Drive
  const driveRegex = /(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
  const driveMatch = url.match(driveRegex);
  if (driveMatch) {
    return {
      url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      provider: 'Google Drive'
    };
  }

  // Direct embed URL (if already formatted)
  if (url.includes('/embed/') || url.includes('/player/')) {
    return {
      url,
      provider: 'Embedded'
    };
  }

  return null;
}

// Helper function to extract video ID from various URL formats
export function extractVideoId(url: string): { provider: string; id: string } | null {
  const embedData = getEmbedData(url);
  if (!embedData) return null;

  // Extract ID from embed URL
  const patterns = {
    YouTube: /embed\/([a-zA-Z0-9_-]{11})/,
    Vimeo: /video\/(\d+)/,
    Loom: /embed\/([a-zA-Z0-9]+)/,
    'Google Drive': /file\/d\/([a-zA-Z0-9_-]+)/
  };

  for (const [provider, pattern] of Object.entries(patterns)) {
    const match = embedData.url.match(pattern);
    if (match) {
      return { provider, id: match[1] };
    }
  }

  return null;
}