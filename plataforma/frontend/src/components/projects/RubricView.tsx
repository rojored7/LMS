import { CheckCircle, Circle } from 'lucide-react';

interface RubricLevel {
  name: string;
  points: number;
  description: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

interface Rubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

interface RubricViewProps {
  rubric: Rubric;
  selectedLevels?: Record<string, number>; // criterionId -> levelIndex
  onSelectLevel?: (criterionId: string, levelIndex: number) => void;
  showScoring?: boolean;
  compact?: boolean;
}

export default function RubricView({
  rubric,
  selectedLevels = {},
  onSelectLevel,
  showScoring = false,
  compact = false
}: RubricViewProps) {
  const calculateScore = (): number => {
    let score = 0;
    let maxScore = 0;

    rubric.criteria.forEach((criterion) => {
      const maxPoints = Math.max(...criterion.levels.map(l => l.points));
      maxScore += maxPoints;

      const selectedLevelIndex = selectedLevels[criterion.id];
      if (selectedLevelIndex !== undefined && selectedLevelIndex >= 0) {
        score += criterion.levels[selectedLevelIndex].points;
      }
    });

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  const calculateWeightedScore = (): number => {
    let score = 0;

    rubric.criteria.forEach((criterion) => {
      const selectedLevelIndex = selectedLevels[criterion.id];
      if (selectedLevelIndex !== undefined && selectedLevelIndex >= 0) {
        const level = criterion.levels[selectedLevelIndex];
        const maxPoints = Math.max(...criterion.levels.map(l => l.points));
        const levelScore = (level.points / maxPoints) * criterion.weight;
        score += levelScore;
      }
    });

    return score;
  };

  const getTotalSelectedPoints = (): number => {
    let points = 0;
    rubric.criteria.forEach((criterion) => {
      const selectedLevelIndex = selectedLevels[criterion.id];
      if (selectedLevelIndex !== undefined && selectedLevelIndex >= 0) {
        points += criterion.levels[selectedLevelIndex].points;
      }
    });
    return points;
  };

  const isInteractive = Boolean(onSelectLevel);
  const score = calculateScore();
  const weightedScore = calculateWeightedScore();
  const totalSelectedPoints = getTotalSelectedPoints();

  if (compact) {
    // Compact view for displaying in lists or cards
    return (
      <div className="space-y-3">
        {showScoring && Object.keys(selectedLevels).length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Puntuación</span>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {totalSelectedPoints} / {rubric.totalPoints} pts
                </div>
                <div className="text-sm text-gray-500">
                  {score.toFixed(1)}% • Peso: {weightedScore.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rubric.criteria.map((criterion) => {
            const selectedIndex = selectedLevels[criterion.id];
            const selectedLevel = selectedIndex !== undefined
              ? criterion.levels[selectedIndex]
              : null;

            return (
              <div key={criterion.id} className="bg-gray-50 rounded p-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{criterion.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Peso: {criterion.weight}%
                    </div>
                  </div>
                  {selectedLevel && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {selectedLevel.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedLevel.points} pts
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full table view
  return (
    <div className="space-y-4">
      {/* Header with scoring */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Rúbrica de Evaluación</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isInteractive
              ? 'Selecciona el nivel alcanzado para cada criterio'
              : 'Criterios y niveles de evaluación'}
          </p>
        </div>

        {showScoring && Object.keys(selectedLevels).length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 min-w-[200px]">
            <div className="text-sm text-gray-600 mb-2">Puntuación Total</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalSelectedPoints} / {rubric.totalPoints}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {score.toFixed(1)}% alcanzado
            </div>
            {rubric.criteria.some(c => c.weight > 0) && (
              <div className="text-sm text-gray-500">
                Peso ponderado: {weightedScore.toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rubric table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-3 text-left">
                Criterio
              </th>
              {rubric.criteria[0]?.levels.map((level, idx) => (
                <th key={idx} className="border border-gray-200 p-3 text-center min-w-[150px]">
                  <div className="font-medium">{level.name}</div>
                  <div className="text-sm text-gray-500">{level.points} puntos</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((criterion) => {
              const selectedIndex = selectedLevels[criterion.id];

              return (
                <tr key={criterion.id}>
                  <td className="border border-gray-200 p-3 align-top">
                    <div className="font-medium text-gray-900">{criterion.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{criterion.description}</div>
                    <div className="text-xs text-gray-500 mt-2">Peso: {criterion.weight}%</div>
                  </td>

                  {criterion.levels.map((level, idx) => {
                    const isSelected = selectedIndex === idx;

                    return (
                      <td
                        key={idx}
                        className={`border border-gray-200 p-3 text-sm align-top ${
                          isSelected ? 'bg-blue-50' : ''
                        } ${isInteractive ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        onClick={() => isInteractive && onSelectLevel?.(criterion.id, idx)}
                      >
                        <div className="space-y-2">
                          {isInteractive && (
                            <div className="flex justify-center">
                              {isSelected ? (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          )}
                          <div className={isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}>
                            {level.description}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* Total row */}
          {showScoring && Object.keys(selectedLevels).length === rubric.criteria.length && (
            <tfoot>
              <tr className="bg-gray-100">
                <td className="border border-gray-200 p-3 font-medium text-right" colSpan={1}>
                  Total
                </td>
                <td
                  className="border border-gray-200 p-3 text-center font-bold text-lg"
                  colSpan={rubric.criteria[0]?.levels.length || 4}
                >
                  {totalSelectedPoints} / {rubric.totalPoints} puntos ({score.toFixed(1)}%)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Instructions or notes */}
      {isInteractive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <p className="text-yellow-800">
            💡 Haz clic en cada celda para seleccionar el nivel alcanzado por el estudiante en ese criterio.
          </p>
        </div>
      )}
    </div>
  );
}