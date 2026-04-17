import { getScoreLabel } from '../../utils/formatters';

interface DifficultyScoreProps {
  score: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const DOT_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#4ade80',
  3: '#a3e635',
  4: '#facc15',
  5: '#fbbf24',
  6: '#f97316',
  7: '#fb923c',
  8: '#ef4444',
  9: '#dc2626',
  10: '#991b1b',
};

function getColor(index: number): string {
  return DOT_COLORS[index] || '#6b7280';
}

export default function DifficultyScore({
  score,
  size = 'sm',
  showLabel = false,
}: DifficultyScoreProps) {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className="inline-flex items-center gap-1.5" title={`${clamped}/10 - ${getScoreLabel(clamped)}`}>
      <div className={`flex items-center ${gap}`}>
        {Array.from({ length: 10 }, (_, i) => {
          const idx = i + 1;
          const filled = idx <= clamped;
          return (
            <span
              key={idx}
              className={`${dotSize} rounded-full inline-block ${
                filled ? '' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              style={filled ? { backgroundColor: getColor(idx) } : undefined}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {clamped}/10 &middot; {getScoreLabel(clamped)}
        </span>
      )}
    </div>
  );
}
