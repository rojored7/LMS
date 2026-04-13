from dataclasses import dataclass, field


@dataclass
class ParsedQuestion:
    order: int = 0
    type: str = "MULTIPLE_CHOICE"
    question: str = ""
    options: list[str] | None = None
    correct_answer: str = ""
    explanation: str | None = None


@dataclass
class ParsedQuiz:
    title: str = ""
    description: str = ""
    passing_score: int = 70
    time_limit: int | None = None
    attempts: int = 3
    questions: list[ParsedQuestion] = field(default_factory=list)


@dataclass
class ParsedLab:
    title: str = ""
    description: str = ""
    language: str = "python"
    starter_code: str = ""
    solution: str = ""
    tests: dict = field(default_factory=dict)
    hints: list[str] | None = None


@dataclass
class ParsedProject:
    title: str = ""
    description: str = ""
    requirements: dict = field(default_factory=dict)
    rubric: dict = field(default_factory=dict)


@dataclass
class ParsedLesson:
    order: int = 0
    title: str = ""
    content: str = ""
    type: str = "TEXT"
    estimated_time: int = 5


@dataclass
class ParsedModule:
    order: int = 0
    title: str = ""
    description: str = ""
    duration: int = 60
    lessons: list[ParsedLesson] = field(default_factory=list)
    quizzes: list[ParsedQuiz] = field(default_factory=list)
    labs: list[ParsedLab] = field(default_factory=list)


@dataclass
class ParsedCourse:
    slug: str = ""
    title: str = ""
    description: str = ""
    duration: int = 2400
    level: str = "BEGINNER"
    tags: list[str] = field(default_factory=list)
    author: str = "Platform"
    version: str = "1.0"
    modules: list[ParsedModule] = field(default_factory=list)
    projects: list[ParsedProject] = field(default_factory=list)
