import { useState } from 'react';
import { Plus, Trash2, Save, GripVertical, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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

interface RubricEditorProps {
  projectId: string;
  initialRubric?: Rubric;
  onSave: (rubric: Rubric) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

const defaultLevels: RubricLevel[] = [
  { name: 'Excelente', points: 4, description: '' },
  { name: 'Bueno', points: 3, description: '' },
  { name: 'Regular', points: 2, description: '' },
  { name: 'Insuficiente', points: 1, description: '' }
];

export default function RubricEditor({
  projectId,
  initialRubric,
  onSave,
  onCancel,
  readOnly = false
}: RubricEditorProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>(
    initialRubric?.criteria || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateId = () => `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: generateId(),
      name: '',
      description: '',
      weight: 25,
      levels: [...defaultLevels]
    };
    setCriteria([...criteria, newCriterion]);
  };

  const updateCriterion = (index: number, updates: Partial<RubricCriterion>) => {
    const updatedCriteria = [...criteria];
    updatedCriteria[index] = { ...updatedCriteria[index], ...updates };
    setCriteria(updatedCriteria);

    // Clear error for this criterion if it exists
    if (errors[updatedCriteria[index].id]) {
      const newErrors = { ...errors };
      delete newErrors[updatedCriteria[index].id];
      setErrors(newErrors);
    }
  };

  const updateLevel = (criterionIndex: number, levelIndex: number, updates: Partial<RubricLevel>) => {
    const updatedCriteria = [...criteria];
    const levels = [...updatedCriteria[criterionIndex].levels];
    levels[levelIndex] = { ...levels[levelIndex], ...updates };
    updatedCriteria[criterionIndex].levels = levels;
    setCriteria(updatedCriteria);
  };

  const deleteCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(criteria);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCriteria(items);
  };

  const calculateTotalPoints = () => {
    return criteria.reduce((sum, c) => {
      const maxPoints = Math.max(...c.levels.map(l => l.points));
      return sum + maxPoints;
    }, 0);
  };

  const validateRubric = (): boolean => {
    const newErrors: Record<string, string> = {};

    criteria.forEach((criterion) => {
      if (!criterion.name.trim()) {
        newErrors[criterion.id] = 'El nombre del criterio es obligatorio';
      } else if (!criterion.description.trim()) {
        newErrors[criterion.id] = 'La descripción del criterio es obligatoria';
      } else if (criterion.weight <= 0 || criterion.weight > 100) {
        newErrors[criterion.id] = 'El peso debe estar entre 1 y 100';
      }

      // Validate level descriptions
      const hasEmptyLevelDescription = criterion.levels.some(
        level => !level.description.trim()
      );
      if (hasEmptyLevelDescription) {
        newErrors[criterion.id] = 'Todos los niveles deben tener descripción';
      }
    });

    // Check total weight
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      newErrors.totalWeight = `El peso total debe ser 100% (actualmente ${totalWeight}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (criteria.length === 0) {
      setErrors({ general: 'Debe agregar al menos un criterio' });
      return;
    }

    if (!validateRubric()) {
      return;
    }

    setIsSaving(true);
    try {
      const rubric: Rubric = {
        criteria,
        totalPoints: calculateTotalPoints()
      };
      await onSave(rubric);
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const totalPoints = calculateTotalPoints();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {readOnly ? 'Rúbrica de Evaluación' : 'Editor de Rúbrica'}
          </h2>
          <p className="text-gray-600 mt-1">
            {readOnly
              ? 'Criterios de evaluación para este proyecto'
              : 'Define los criterios de evaluación para este proyecto'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total de puntos</div>
          <div className="text-2xl font-bold text-gray-900">{totalPoints}</div>
        </div>
      </div>

      {/* Weight indicator */}
      {!readOnly && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          Math.abs(totalWeight - 100) < 0.01
            ? 'bg-green-50 text-green-800'
            : 'bg-yellow-50 text-yellow-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>
            Peso total: {totalWeight}% {Math.abs(totalWeight - 100) < 0.01 ? '✓' : '(debe sumar 100%)'}
          </span>
        </div>
      )}

      {/* General error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
          {errors.general}
        </div>
      )}

      {/* Total weight error */}
      {errors.totalWeight && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
          {errors.totalWeight}
        </div>
      )}

      {/* Criteria table */}
      {criteria.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No hay criterios definidos aún</p>
          {!readOnly && (
            <button
              onClick={addCriterion}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar Primer Criterio
            </button>
          )}
        </div>
      ) : readOnly ? (
        // Read-only view
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-3 text-left">
                  Criterio ({totalWeight}%)
                </th>
                {defaultLevels.map((level, idx) => (
                  <th key={idx} className="border border-gray-200 p-3 text-center">
                    {level.name} ({level.points} pts)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterion) => (
                <tr key={criterion.id}>
                  <td className="border border-gray-200 p-3">
                    <div className="font-semibold text-gray-900">{criterion.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{criterion.description}</div>
                    <div className="text-xs text-gray-500 mt-2">Peso: {criterion.weight}%</div>
                  </td>
                  {criterion.levels.map((level, idx) => (
                    <td key={idx} className="border border-gray-200 p-3 text-sm">
                      {level.description}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Editable view with drag and drop
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="criteria">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 p-2 w-8"></th>
                        <th className="border border-gray-200 p-2 text-left">Criterio</th>
                        {defaultLevels.map((level, idx) => (
                          <th key={idx} className="border border-gray-200 p-2 text-center">
                            {level.name} ({level.points} pts)
                          </th>
                        ))}
                        <th className="border border-gray-200 p-2 w-20">Peso %</th>
                        <th className="border border-gray-200 p-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((criterion, cIndex) => (
                        <Draggable key={criterion.id} draggableId={criterion.id} index={cIndex}>
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${snapshot.isDragging ? 'bg-blue-50' : 'bg-white'} ${
                                errors[criterion.id] ? 'border-red-500' : ''
                              }`}
                            >
                              <td
                                {...provided.dragHandleProps}
                                className="border border-gray-200 p-2 cursor-move text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="w-5 h-5" />
                              </td>
                              <td className="border border-gray-200 p-2">
                                <input
                                  type="text"
                                  value={criterion.name}
                                  onChange={(e) => updateCriterion(cIndex, { name: e.target.value })}
                                  placeholder="Nombre del criterio"
                                  className="w-full px-2 py-1 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <textarea
                                  value={criterion.description}
                                  onChange={(e) => updateCriterion(cIndex, { description: e.target.value })}
                                  placeholder="Descripción del criterio"
                                  rows={2}
                                  className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {errors[criterion.id] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[criterion.id]}</p>
                                )}
                              </td>
                              {criterion.levels.map((level, lIndex) => (
                                <td key={lIndex} className="border border-gray-200 p-2">
                                  <textarea
                                    value={level.description}
                                    onChange={(e) => updateLevel(cIndex, lIndex, {
                                      description: e.target.value
                                    })}
                                    placeholder={`Descripción para ${level.name}`}
                                    rows={3}
                                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                              ))}
                              <td className="border border-gray-200 p-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={criterion.weight}
                                  onChange={(e) => updateCriterion(cIndex, {
                                    weight: parseInt(e.target.value) || 0
                                  })}
                                  className="w-full px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="border border-gray-200 p-2 text-center">
                                <button
                                  onClick={() => deleteCriterion(cIndex)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Eliminar criterio"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                    </tbody>
                  </table>
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Action buttons */}
      {!readOnly && (
        <div className="flex justify-between items-center">
          <button
            onClick={addCriterion}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Criterio
          </button>

          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || criteria.length === 0}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Rúbrica
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}