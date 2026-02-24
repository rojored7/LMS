# HU-017: Sistema de Quizzes (Multiple Choice, True/False)

**Épica:** EP-005 - Sistema de Evaluaciones
**Sprint:** 4
**Story Points:** 8
**Prioridad:** Should Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** instructor
**Quiero** crear quizzes con diferentes tipos de preguntas
**Para** evaluar el conocimiento de los estudiantes automáticamente

---

## Criterios de Aceptación

- [ ] **AC1:** Modelo de datos Quiz: id, lessonId, title, passingScore (%), timeLimit (minutos), attemptsAllowed
- [ ] **AC2:** Modelo Question: id, quizId, type (multiple_choice, true_false, short_answer), text, order, points
- [ ] **AC3:** Modelo Answer: id, questionId, text, isCorrect (boolean)
- [ ] **AC4:** Interfaz admin de creación de quiz con editor WYSIWYG
- [ ] **AC5:** Drag & drop para ordenar preguntas dentro del quiz
- [ ] **AC6:** Editor de preguntas con opciones de respuesta dinámicas (agregar/eliminar)
- [ ] **AC7:** Marcar una o múltiples respuestas correctas según tipo de pregunta
- [ ] **AC8:** Preview del quiz completo antes de publicar
- [ ] **AC9:** Validación: al menos 1 respuesta correcta por pregunta
- [ ] **AC10:** Endpoints: POST/GET /api/quizzes, GET/PUT/DELETE /api/quizzes/:id

---

## Definición de Hecho (DoD)

- [ ] Código implementado (backend y frontend)
- [ ] Tests unitarios escritos y pasando (>80% coverage)
- [ ] Tests de integración escritos y pasando
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Code review realizado y aprobado
- [ ] Documentación técnica actualizada (JSDoc/Swagger)
- [ ] Validado en entorno Docker local
- [ ] Sin warnings de linter ni TypeScript errors

---

## Detalles Técnicos

### Backend

**Modelos (Prisma):**
```prisma
model Quiz {
  id              String     @id @default(uuid())
  lessonId        String
  lesson          Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  title           String
  description     String?
  passingScore    Int        @default(70) // Porcentaje
  timeLimit       Int?       // Minutos, null = sin límite
  attemptsAllowed Int        @default(3)
  published       Boolean    @default(false)
  questions       Question[]
  attempts        QuizAttempt[]
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

model Question {
  id      String   @id @default(uuid())
  quizId  String
  quiz    Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  type    QuestionType
  text    String
  order   Int
  points  Int      @default(1)
  answers Answer[]
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
}

model Answer {
  id         String   @id @default(uuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  isCorrect  Boolean  @default(false)
  order      Int
}
```

**Servicios:**
```typescript
class QuizService {
  static async createQuiz(data: CreateQuizDto, instructorId: string) {
    // Validar estructura de quiz
    this.validateQuizData(data)

    return prisma.quiz.create({
      data: {
        ...data,
        questions: {
          create: data.questions.map((q, index) => ({
            type: q.type,
            text: q.text,
            order: index,
            points: q.points || 1,
            answers: {
              create: q.answers.map((a, aIndex) => ({
                text: a.text,
                isCorrect: a.isCorrect,
                order: aIndex
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  static validateQuizData(data: any) {
    // AC9: Validar que cada pregunta tiene al menos 1 respuesta correcta
    for (const question of data.questions) {
      const hasCorrectAnswer = question.answers.some(a => a.isCorrect)
      if (!hasCorrectAnswer) {
        throw new Error(`Pregunta "${question.text}" no tiene respuesta correcta`)
      }

      // Validar según tipo de pregunta
      if (question.type === 'TRUE_FALSE' && question.answers.length !== 2) {
        throw new Error('Preguntas True/False deben tener exactamente 2 respuestas')
      }

      if (question.type === 'MULTIPLE_CHOICE' && question.answers.length < 2) {
        throw new Error('Preguntas de opción múltiple deben tener al menos 2 respuestas')
      }
    }
  }

  static async getQuizWithAnswers(quizId: string, includeCorrectAnswers: boolean = false) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            answers: includeCorrectAnswers ? true : {
              select: {
                id: true,
                text: true,
                order: true
                // NO incluir isCorrect para estudiantes
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    return quiz
  }
}
```

**Controladores:**
```typescript
export const createQuizController = async (req: Request, res: Response) => {
  try {
    const instructorId = req.user!.userId
    const quizData = createQuizSchema.parse(req.body)

    const quiz = await QuizService.createQuiz(quizData, instructorId)

    res.status(201).json({ quiz })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors })
    }
    res.status(500).json({ error: error.message })
  }
}

export const getQuizController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const isInstructor = ['ADMIN', 'INSTRUCTOR'].includes(req.user!.role)

    // Instructores ven respuestas correctas, estudiantes no
    const quiz = await QuizService.getQuizWithAnswers(id, isInstructor)

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    res.json({ quiz })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener quiz' })
  }
}
```

### Frontend

**Componentes:**
```typescript
// QuizBuilder.tsx - Constructor de quiz
export function QuizBuilder() {
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: null,
    attemptsAllowed: 3,
    questions: []
  })

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: generateTempId(),
      type,
      text: '',
      points: 1,
      answers: type === 'TRUE_FALSE'
        ? [
            { id: generateTempId(), text: 'Verdadero', isCorrect: false },
            { id: generateTempId(), text: 'Falso', isCorrect: false }
          ]
        : []
    }

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  return (
    <div className="quiz-builder">
      <QuizSettings quiz={quiz} onChange={setQuiz} />

      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={quiz.questions}>
          {quiz.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onChange={(updated) => updateQuestion(index, updated)}
              onDelete={() => deleteQuestion(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <AddQuestionButtons onAdd={addQuestion} />

      <div className="actions">
        <Button onClick={handlePreview}>Vista Previa</Button>
        <Button onClick={handleSave}>Guardar Quiz</Button>
      </div>
    </div>
  )
}

// QuestionEditor.tsx
export function QuestionEditor({ question, index, onChange, onDelete }: Props) {
  const addAnswer = () => {
    onChange({
      ...question,
      answers: [
        ...question.answers,
        { id: generateTempId(), text: '', isCorrect: false }
      ]
    })
  }

  const updateAnswer = (answerIndex: number, updated: Partial<Answer>) => {
    const newAnswers = [...question.answers]
    newAnswers[answerIndex] = { ...newAnswers[answerIndex], ...updated }
    onChange({ ...question, answers: newAnswers })
  }

  return (
    <Card className="question-editor">
      <CardHeader>
        <Input
          placeholder="Escribe la pregunta..."
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
        />
        <div className="question-meta">
          <Select
            value={question.type}
            onChange={(e) => onChange({ ...question, type: e.target.value })}
          >
            <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
            <option value="TRUE_FALSE">Verdadero/Falso</option>
            <option value="SHORT_ANSWER">Respuesta Corta</option>
          </Select>
          <Input
            type="number"
            placeholder="Puntos"
            value={question.points}
            onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) })}
          />
        </div>
      </CardHeader>

      <CardContent>
        {question.answers.map((answer, aIndex) => (
          <div key={answer.id} className="answer-option">
            <Checkbox
              checked={answer.isCorrect}
              onChange={(e) => updateAnswer(aIndex, { isCorrect: e.target.checked })}
            />
            <Input
              value={answer.text}
              placeholder="Texto de la respuesta"
              onChange={(e) => updateAnswer(aIndex, { text: e.target.value })}
            />
            {question.type !== 'TRUE_FALSE' && (
              <Button variant="ghost" onClick={() => deleteAnswer(aIndex)}>
                <Trash2 />
              </Button>
            )}
          </div>
        ))}

        {question.type !== 'TRUE_FALSE' && (
          <Button variant="outline" onClick={addAnswer}>
            + Agregar Respuesta
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

**Hooks:**
```typescript
export function useCreateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quizData: CreateQuizDto) => quizApi.createQuiz(quizData),
    onSuccess: () => {
      queryClient.invalidateQueries(['quizzes'])
      toast.success('Quiz creado exitosamente')
    }
  })
}
```

### Base de Datos

**Migraciones:**
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit INTEGER, -- minutos
  attempts_allowed INTEGER DEFAULT 3,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  points INTEGER DEFAULT 1
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  "order" INTEGER NOT NULL
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_answers_question ON answers(question_id);
```

---

## Dependencias

**Depende de:**
- HU-011: Modelo de Datos (necesita modelo Lesson)

**Bloqueante para:**
- HU-018: Auto-calificación de Quizzes
- HU-019: Historial de Intentos

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-017: Sistema de Quizzes', () => {
  it('AC1, AC2, AC3: Debe crear quiz con preguntas y respuestas', async () => {
    const quizData = {
      lessonId: 'lesson-123',
      title: 'Quiz de Seguridad Web',
      passingScore: 70,
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          text: '¿Qué es XSS?',
          points: 2,
          answers: [
            { text: 'Cross-Site Scripting', isCorrect: true },
            { text: 'Cross-Site Sharing', isCorrect: false }
          ]
        }
      ]
    }

    const quiz = await QuizService.createQuiz(quizData, 'instructor-123')

    expect(quiz.title).toBe('Quiz de Seguridad Web')
    expect(quiz.questions).toHaveLength(1)
    expect(quiz.questions[0].answers).toHaveLength(2)
    expect(quiz.questions[0].answers.find(a => a.isCorrect)).toBeDefined()
  })

  it('AC9: Debe rechazar pregunta sin respuesta correcta', async () => {
    const invalidQuiz = {
      title: 'Test',
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          text: 'Pregunta',
          answers: [
            { text: 'A', isCorrect: false },
            { text: 'B', isCorrect: false }
          ]
        }
      ]
    }

    await expect(QuizService.createQuiz(invalidQuiz, 'instructor-123'))
      .rejects.toThrow('no tiene respuesta correcta')
  })

  it('Debe validar preguntas True/False con exactamente 2 respuestas', async () => {
    const invalidTrueFalse = {
      title: 'Test',
      questions: [
        {
          type: 'TRUE_FALSE',
          text: 'Pregunta',
          answers: [{ text: 'Verdadero', isCorrect: true }] // Falta una respuesta
        }
      ]
    }

    await expect(QuizService.createQuiz(invalidTrueFalse, 'instructor-123'))
      .rejects.toThrow('exactamente 2 respuestas')
  })

  it('Instructores deben ver respuestas correctas, estudiantes no', async () => {
    const quiz = await createTestQuiz()

    const instructorView = await QuizService.getQuizWithAnswers(quiz.id, true)
    const studentView = await QuizService.getQuizWithAnswers(quiz.id, false)

    expect(instructorView.questions[0].answers[0]).toHaveProperty('isCorrect')
    expect(studentView.questions[0].answers[0]).not.toHaveProperty('isCorrect')
  })
})
```

### Tests de Integración

```typescript
describe('[Quiz System] Integration Tests', () => {
  it('AC10: Instructor debe poder crear quiz completo', async () => {
    const instructorToken = await getInstructorToken()

    const response = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        lessonId: 'lesson-123',
        title: 'Quiz Final',
        passingScore: 80,
        questions: [
          {
            type: 'MULTIPLE_CHOICE',
            text: '¿Qué es OWASP?',
            points: 2,
            answers: [
              { text: 'Open Web Application Security Project', isCorrect: true },
              { text: 'Online Web App Security Protocol', isCorrect: false }
            ]
          }
        ]
      })
      .expect(201)

    expect(response.body.quiz).toHaveProperty('id')
    expect(response.body.quiz.title).toBe('Quiz Final')
  })

  it('Estudiantes NO pueden crear quizzes', async () => {
    const studentToken = await getStudentToken()

    await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Test' })
      .expect(403)
  })
})
```

---

## Notas Adicionales

**UX/UI:**
- Drag & drop library: `@dnd-kit/core`
- Rich text editor para preguntas con formato
- Preview mode que simula la vista del estudiante
- Guardar como borrador (published: false)
- Duplicar quiz existente para crear variantes

**Validaciones Adicionales:**
- Límite de caracteres en preguntas y respuestas
- Mínimo 1 pregunta por quiz
- Máximo recomendado: 50 preguntas por quiz

**Mejoras Futuras:**
- Banco de preguntas reutilizables
- Generación aleatoria de quizzes desde banco
- Multimedia en preguntas (imágenes, videos)
- Explicación de respuesta correcta

---

## Referencias

- Backlog: `docs/backlog.md` - Sprint 4, HU-017
- Documento de Arquitectura: `docs/arquitectura.md`
