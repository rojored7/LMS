import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, Eye, X, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { quizService } from '../services/api/quizBuilder.service';
import { LoadingSpinner } from '../components/common';
import { useToast } from '../hooks/useToast';
import QuestionEditor from '../components/quiz/QuestionEditor';
import QuizPreview from '../components/quiz/QuizPreview';

// Esquema de validación
const quizSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  timeLimit: z.number().min(5, 'El tiempo mínimo es 5 minutos').max(180, 'El tiempo máximo es 180 minutos'),
  passingScore: z.number().min(50, 'La puntuación mínima es 50%').max(100, 'La puntuación máxima es 100%'),
  maxAttempts: z.number().min(1, 'Debe permitir al menos 1 intento').max(10, 'Máximo 10 intentos')
});

type QuizFormData = z.infer<typeof quizSchema>;

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text: string;
  points: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
}

export default function QuizBuilder() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3
    }
  });

  // Cargar quiz existente si está en modo edición
  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      const quiz = await quizService.getQuiz(quizId!);
      setValue('title', quiz.title);
      setValue('description', quiz.description);
      setValue('timeLimit', quiz.timeLimit);
      setValue('passingScore', quiz.passingScore);
      setValue('maxAttempts', quiz.maxAttempts);
      setQuestions(quiz.questions || []);
    } catch (error) {
      showToast('Error al cargar el quiz', 'error');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'MULTIPLE_CHOICE',
      text: '',
      points: 1,
      options: [
        { id: `opt_1`, text: '', isCorrect: false },
        { id: `opt_2`, text: '', isCorrect: false },
        { id: `opt_3`, text: '', isCorrect: false },
        { id: `opt_4`, text: '', isCorrect: false }
      ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updated: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    showToast('Pregunta eliminada', 'info');
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  const validateQuestions = (): boolean => {
    if (questions.length === 0) {
      showToast('Debe agregar al menos una pregunta', 'error');
      return false;
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        showToast('Todas las preguntas deben tener texto', 'error');
        return false;
      }

      if (question.type === 'MULTIPLE_CHOICE') {
        const hasCorrect = question.options?.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          showToast('Las preguntas de opción múltiple deben tener al menos una respuesta correcta', 'error');
          return false;
        }

        const hasOptions = question.options?.filter(opt => opt.text.trim()).length || 0;
        if (hasOptions < 2) {
          showToast('Las preguntas de opción múltiple deben tener al menos 2 opciones', 'error');
          return false;
        }
      }

      if (question.type === 'SHORT_ANSWER' && !question.correctAnswer?.trim()) {
        showToast('Las preguntas de respuesta corta deben tener una respuesta correcta', 'error');
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: QuizFormData) => {
    if (!validateQuestions()) return;

    setIsSaving(true);
    try {
      const quizData = {
        ...data,
        courseId: courseId!,
        questions
      };

      if (quizId) {
        await quizService.updateQuiz(quizId, quizData);
        showToast('Quiz actualizado exitosamente', 'success');
      } else {
        await quizService.createQuiz(quizData);
        showToast('Quiz creado exitosamente', 'success');
      }

      navigate(`/courses/${courseId}`);
    } catch (error: any) {
      showToast(error.message || 'Error al guardar el quiz', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalPoints = () => {
    return questions.reduce((sum, q) => sum + q.points, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {quizId ? 'Editar Quiz' : 'Crear Nuevo Quiz'}
        </h1>
        <p className="mt-2 text-gray-600">
          Diseña evaluaciones interactivas para tus estudiantes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Información del Quiz */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Quiz</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del Quiz
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Evaluación del Módulo 1"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el propósito y contenido del quiz"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo límite (minutos)
                </label>
                <input
                  type="number"
                  {...register('timeLimit', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.timeLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeLimit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntuación mínima (%)
                </label>
                <input
                  type="number"
                  {...register('passingScore', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.passingScore && (
                  <p className="mt-1 text-sm text-red-600">{errors.passingScore.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intentos máximos
                </label>
                <input
                  type="number"
                  {...register('maxAttempts', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.maxAttempts && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxAttempts.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Preguntas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Preguntas</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total: {questions.length} preguntas • {getTotalPoints()} puntos
              </p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar Pregunta
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay preguntas aún</p>
              <button
                type="button"
                onClick={addQuestion}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Agregar primera pregunta
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {questions.map((question, index) => (
                      <Draggable
                        key={question.id}
                        draggableId={question.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-4 cursor-move text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <QuestionEditor
                                  question={question}
                                  index={index}
                                  onUpdate={(updated) => updateQuestion(index, updated)}
                                  onDelete={() => deleteQuestion(index)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={questions.length === 0}
              className="inline-flex items-center px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-5 h-5 mr-2" />
              Vista Previa
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {quizId ? 'Actualizar Quiz' : 'Crear Quiz'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <QuizPreview
          quiz={{
            title: handleSubmit((data) => data.title)() || '',
            description: handleSubmit((data) => data.description)() || '',
            questions,
            timeLimit: handleSubmit((data) => data.timeLimit)() || 30,
            passingScore: handleSubmit((data) => data.passingScore)() || 70
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}