from dataclasses import dataclass, field


@dataclass
class QuizQuestionData:
    text: str
    type: str = "MULTIPLE_CHOICE"
    options: str = ""
    correct_answer: str = ""
    explanation: str = ""
    points: int = 1
    order: int = 0


@dataclass
class QuizData:
    title: str
    description: str = ""
    passing_score: int = 70
    max_attempts: int = 3
    questions: list[QuizQuestionData] = field(default_factory=list)


@dataclass
class LabData:
    title: str
    description: str = ""
    instructions: str = ""
    starter_code: str = ""
    solution_code: str = ""
    test_code: str = ""
    language: str = "python"
    timeout_seconds: int = 30


@dataclass
class ProjectData:
    title: str
    description: str = ""
    requirements: str = ""
    rubric: str = ""


@dataclass
class LessonData:
    title: str
    content: str = ""
    type: str = "TEXT"
    order: int = 0
    duration_minutes: int = 5
    video_url: str = ""


@dataclass
class ModuleData:
    title: str
    description: str = ""
    order: int = 0
    lessons: list[LessonData] = field(default_factory=list)
    quizzes: list[QuizData] = field(default_factory=list)
    labs: list[LabData] = field(default_factory=list)
    projects: list[ProjectData] = field(default_factory=list)


@dataclass
class CourseData:
    title: str
    slug: str = ""
    description: str = ""
    short_description: str = ""
    level: str = "BEGINNER"
    duration_hours: int = 0
    modules: list[ModuleData] = field(default_factory=list)
