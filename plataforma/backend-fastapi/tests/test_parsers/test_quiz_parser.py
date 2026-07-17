"""Tests for quiz_parser.py — covers 3 bugs:
Bug 1: answer section regex doesn't match real heading variants
Bug 2: essay sub-parts a)/b) treated as MC options
Bug 3: questions without options silently discarded (never SHORT_ANSWER)
"""
import textwrap
from pathlib import Path

import pytest

from app.scripts.parsers.quiz_parser import parse_quizzes


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_quiz_dir(tmp_path: Path, filename: str, content: str) -> Path:
    """Write a cuestionario.md file inside a fake evaluacion/ subdir."""
    evaluacion = tmp_path / "evaluacion"
    evaluacion.mkdir()
    (evaluacion / filename).write_text(textwrap.dedent(content), encoding="utf-8")
    return tmp_path


# ===========================================================================
# Slice 1 — Bug 1: answer section header variants
# ===========================================================================

SOLUCIONES_MD = """\
# Quiz con Soluciones

## Pregunta 1
Cual es la salida de print(1+1)?

a) 0
b) 1
c) 2
d) 3

## Soluciones

### Respuesta 1: C
Porque 1+1=2.
"""

CLAVE_RESPUESTAS_MD = """\
# Quiz Clave de Respuestas

## Pregunta 1
Que simbolo se usa en Python para comentarios?

a) //
b) --
c) #
d) **

## Clave de Respuestas

### Respuesta 1: C
El simbolo # introduce un comentario de una linea.
"""

RESPUESTAS_DE_REFERENCIA_MD = """\
# Quiz Ensayo

## Pregunta 1
Explica que es una variable.

**Tu respuesta**: _Escribe aqui_

## Respuestas de Referencia

### Respuesta 1
Una variable es un espacio en memoria con nombre que almacena un valor.
"""

RESPUESTA_SIN_PAREN_MD = """\
# Quiz sin paren

## Pregunta 1
Cual lenguaje es interpretado?

a) C
b) C++
c) Python
d) Java

**Respuesta correcta**: c
"""

NUMBERED_LIST_FORMAT_MD = """\
# Quiz numerado

## Pregunta 1
El operador % hace?

a) Multiplicacion
b) Modulo
c) Division
d) Potencia

## Clave de Respuestas

2. B - El modulo devuelve el resto de la division.
1. B - El operador % calcula el resto (modulo).
"""


class TestBug1AnswerSectionHeader:
    def test_answer_section_soluciones_sets_correct_answer(self, tmp_path):
        """## Soluciones header should be recognized as answer section."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", SOLUCIONES_MD)
        quizzes = parse_quizzes(d)
        assert quizzes, "No quizzes parsed"
        assert quizzes[0].questions, "No questions parsed"
        q = quizzes[0].questions[0]
        assert q.correct_answer == 2, (
            f"Expected correct_answer=2 (C=index 2), got {q.correct_answer!r}. "
            "Bug 1: '## Soluciones' not recognized as answer section."
        )

    def test_answer_section_clave_de_respuestas_sets_correct_answer(self, tmp_path):
        """## Clave de Respuestas header should be recognized as answer section."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", CLAVE_RESPUESTAS_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        assert q.correct_answer == 2, (
            f"Expected correct_answer=2 (C=index 2), got {q.correct_answer!r}. "
            "Bug 1: '## Clave de Respuestas' not recognized as answer section."
        )

    def test_answer_section_respuestas_de_referencia_sets_explanation(self, tmp_path):
        """## Respuestas de Referencia should populate explanation on SHORT_ANSWER."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", RESPUESTAS_DE_REFERENCIA_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions, "No questions parsed (Bug 3)"
        q = quizzes[0].questions[0]
        assert q.explanation, (
            "Expected explanation to be populated from '## Respuestas de Referencia'. "
            "Bug 1: reference answer section not recognized."
        )
        assert "variable" in q.explanation.lower(), (
            f"Explanation should contain reference answer text, got: {q.explanation!r}"
        )

    def test_respuesta_without_paren_parsed(self, tmp_path):
        """### Respuesta N: B (no closing paren) should be parsed."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", RESPUESTA_SIN_PAREN_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        # inline "Respuesta correcta: c" → index 2
        assert q.correct_answer == 2, (
            f"Expected correct_answer=2 (c=index 2), got {q.correct_answer!r}. "
            "Bug 1: trailing ')' breaks answer parsing."
        )

    def test_numbered_list_format_answer_parsed(self, tmp_path):
        """'1. B - explanation' numbered list format should set correct_answer."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", NUMBERED_LIST_FORMAT_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        assert q.correct_answer == 1, (
            f"Expected correct_answer=1 (B=index 1), got {q.correct_answer!r}. "
            "Bug 1: numbered list format '1. B - text' not recognized."
        )


# ===========================================================================
# Slice 2 — Bug 2: essay sub-parts vs MC options
# ===========================================================================

ESSAY_WITH_SUBPARTS_MD = """\
# Evaluacion

## Pregunta 1
Analiza el siguiente problema:

a) Que tipo de error puede ocurrir?
b) Como lo diagnosticarias?
c) Que herramientas usarias?

**Tu respuesta**: _Escribe aqui_
"""

MC_WITH_RESPUESTA_CORRECTA_MD = """\
# Quiz MC

## Pregunta 1
Cual es el resultado de 2**3?

a) 6
b) 8
c) 9
d) 12

**Respuesta correcta**: b
**Explicacion**: Dos elevado a la tres es ocho.
"""

MC_WITHOUT_INLINE_ANSWER_MD = """\
# Quiz MC separado

## Pregunta 1
Cual metodo convierte string a mayusculas en Python?

a) string.upper()
b) string.toUpper()
c) string.capitalize()
d) string.makeUpper()

## Soluciones

### Respuesta 1: A
El metodo upper() convierte todos los caracteres a mayusculas.
"""

TRUE_FALSE_MD = """\
# Quiz TrueFalse

## Pregunta 1
Python es un lenguaje compilado.

a) Verdadero
b) Falso

**Respuesta correcta**: b
"""


class TestBug2McVsEssayDiscrimination:
    def test_essay_subparts_not_captured_as_options(self, tmp_path):
        """a)/b)/c) sub-parts in essay questions must NOT become MC options."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", ESSAY_WITH_SUBPARTS_MD)
        quizzes = parse_quizzes(d)
        # With Bug 3 fixed, we get a SHORT_ANSWER; otherwise the question is dropped.
        # Either way, the question must NOT be MULTIPLE_CHOICE with sub-parts as options.
        if quizzes and quizzes[0].questions:
            q = quizzes[0].questions[0]
            assert q.type == "SHORT_ANSWER", (
                f"Essay question should be SHORT_ANSWER, got {q.type!r}. "
                "Bug 2: essay sub-parts treated as MC options."
            )
            assert q.options is None, (
                f"Essay question should have options=None, got {q.options!r}. "
                "Bug 2: 'a) Que tipo de error?' captured as MC option."
            )
        # If the question was dropped entirely, that means Bug 3 is also present.
        # The important thing is it's NOT stored as MULTIPLE_CHOICE with wrong options.

    def test_mc_options_captured_with_inline_respuesta_correcta(self, tmp_path):
        """MC question with inline **Respuesta correcta**: must capture all 4 options."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", MC_WITH_RESPUESTA_CORRECTA_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        assert q.type == "MULTIPLE_CHOICE", f"Expected MULTIPLE_CHOICE, got {q.type!r}"
        assert q.options is not None, "Expected options list, got None"
        assert len(q.options) == 4, f"Expected 4 options, got {len(q.options)}: {q.options}"
        assert q.correct_answer == 1, f"Expected correct_answer=1 (b), got {q.correct_answer!r}"

    def test_mc_options_captured_without_inline_answer(self, tmp_path):
        """MC question with answer in ## Soluciones section must still capture 4 options."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", MC_WITHOUT_INLINE_ANSWER_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        assert q.type == "MULTIPLE_CHOICE", f"Expected MULTIPLE_CHOICE, got {q.type!r}"
        assert q.options is not None and len(q.options) == 4, (
            f"Expected 4 options, got: {q.options}"
        )
        assert q.correct_answer == 0, (
            f"Expected correct_answer=0 (A=index 0), got {q.correct_answer!r}"
        )

    def test_true_false_two_options_captured(self, tmp_path):
        """TRUE_FALSE question with exactly 2 options a)/b) must capture both options."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", TRUE_FALSE_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        assert q.options is not None and len(q.options) == 2, (
            f"TRUE_FALSE with 2 options should capture both, got: {q.options}"
        )
        assert q.correct_answer == 1, f"Expected correct_answer=1 (b/Falso), got {q.correct_answer!r}"


# ===========================================================================
# Slice 3 — Bug 3: SHORT_ANSWER emission
# ===========================================================================

PURE_ESSAY_MD = """\
# Evaluacion de Fundamentos

## Pregunta 1
Explica que es un algoritmo y da un ejemplo de la vida cotidiana.

**Tu respuesta**: _Escribe aqui_

---

## Pregunta 2
Describe las diferencias entre un lenguaje compilado e interpretado.

**Tu respuesta**: _Escribe aqui_
"""

ESSAY_CORRECT_ANSWER_TYPE_MD = """\
# Evaluacion

## Pregunta 1
Que es la herencia en programacion orientada a objetos?

**Tu respuesta**: _Escribe aqui_
"""

MIXED_MC_AND_ESSAY_MD = """\
# Quiz Mixto

## Pregunta 1
Python es dinamicamente tipado?

a) Si
b) No

**Respuesta correcta**: a

## Pregunta 2
Explica en tus palabras que es una funcion lambda.

**Tu respuesta**: _Escribe aqui_
"""


class TestBug3ShortAnswerEmission:
    def test_essay_question_emitted_as_short_answer(self, tmp_path):
        """Questions without options must be emitted as SHORT_ANSWER, not dropped."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", PURE_ESSAY_MD)
        quizzes = parse_quizzes(d)
        assert quizzes, "Quiz not parsed at all"
        questions = quizzes[0].questions
        assert len(questions) == 2, (
            f"Expected 2 SHORT_ANSWER questions, got {len(questions)}. "
            "Bug 3: essay questions silently dropped."
        )
        for q in questions:
            assert q.type == "SHORT_ANSWER", (
                f"Expected SHORT_ANSWER, got {q.type!r}. "
                "Bug 3: parser never emits SHORT_ANSWER."
            )
            assert q.options is None, f"SHORT_ANSWER must have options=None, got {q.options!r}"

    def test_short_answer_correct_answer_is_empty_string(self, tmp_path):
        """SHORT_ANSWER correct_answer must be '' (str), not 0 (int) — avoids IndexError in scoring."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", ESSAY_CORRECT_ANSWER_TYPE_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]
        assert q.type == "SHORT_ANSWER"
        assert isinstance(q.correct_answer, str), (
            f"correct_answer must be str for SHORT_ANSWER, got {type(q.correct_answer).__name__!r}. "
            "scoring.py does opts[expected] for int — would IndexError on options=None."
        )
        assert q.correct_answer == "", (
            f"correct_answer should be empty string for essay without answer key, got {q.correct_answer!r}"
        )

    def test_short_answer_does_not_cause_index_error_in_scoring(self, tmp_path):
        """Verify SHORT_ANSWER with correct_answer='' doesn't crash calculate_quiz_score."""
        from app.services.scoring import calculate_quiz_score
        from types import SimpleNamespace

        d = make_quiz_dir(tmp_path, "cuestionario.md", ESSAY_CORRECT_ANSWER_TYPE_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        q = quizzes[0].questions[0]

        # Simulate what happens when a student submits an answer.
        # calculate_quiz_score expects answers: dict[str, str] keyed by question.id
        mock_question = SimpleNamespace(
            id="test_q_1",
            type=q.type,
            options=q.options,
            correct_answer=q.correct_answer,
        )
        # Must not raise IndexError or any exception
        try:
            correct, total = calculate_quiz_score([mock_question], {"test_q_1": "Mi respuesta"})
            assert total == 1, f"Expected total=1, got {total}"
        except Exception as e:
            pytest.fail(
                f"calculate_quiz_score raised {type(e).__name__}: {e}. "
                f"SHORT_ANSWER with correct_answer={q.correct_answer!r} and options={q.options!r} must not crash."
            )

    def test_mixed_quiz_mc_and_essay(self, tmp_path):
        """Quiz with MC + essay questions must produce both MULTIPLE_CHOICE and SHORT_ANSWER."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", MIXED_MC_AND_ESSAY_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and len(quizzes[0].questions) == 2, (
            f"Expected 2 questions (1 MC + 1 essay), got {len(quizzes[0].questions) if quizzes else 0}. "
            "Bug 3: essay question dropped."
        )
        types = {q.type for q in quizzes[0].questions}
        assert "MULTIPLE_CHOICE" in types, "MC question missing"
        assert "SHORT_ANSWER" in types, "SHORT_ANSWER question missing — Bug 3"

    def test_question_order_preserved_in_mixed_quiz(self, tmp_path):
        """order field must be sequential starting from 1."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", MIXED_MC_AND_ESSAY_MD)
        quizzes = parse_quizzes(d)
        assert quizzes and quizzes[0].questions
        orders = [q.order for q in quizzes[0].questions]
        assert orders == list(range(1, len(orders) + 1)), (
            f"Expected sequential orders [1, 2, ...], got {orders}"
        )


# ===========================================================================
# Regression — Format A (inline MC) must still work after all fixes
# ===========================================================================

FORMAT_A_INLINE_MC_MD = """\
# Quiz Ciberseguridad

### 1. Que es un firewall?

a) Un tipo de virus
b) Un sistema que filtra el trafico de red
c) Un protocolo de cifrado
d) Un servidor DNS

**Respuesta correcta**: b
**Explicacion**: Un firewall filtra el trafico segun reglas de seguridad.

### 2. Que significa CIA en seguridad?

a) Central Intelligence Agency
b) Confidencialidad, Integridad, Autenticacion
c) Confidencialidad, Integridad, Disponibilidad
d) Cifrado, Identidad, Acceso

**Respuesta correcta**: c
"""


class TestRegressionFormatA:
    def test_format_a_inline_mc_still_works(self, tmp_path):
        """Original Format A (inline MC with ### N. and **Respuesta correcta**) must still parse."""
        d = make_quiz_dir(tmp_path, "cuestionario.md", FORMAT_A_INLINE_MC_MD)
        quizzes = parse_quizzes(d)
        assert quizzes, "No quiz parsed"
        questions = quizzes[0].questions
        assert len(questions) == 2, f"Expected 2 questions, got {len(questions)}"
        assert questions[0].type == "MULTIPLE_CHOICE"
        assert questions[0].correct_answer == 1, f"Q1: expected 1 (b), got {questions[0].correct_answer!r}"
        assert questions[1].correct_answer == 2, f"Q2: expected 2 (c), got {questions[1].correct_answer!r}"
        assert len(questions[0].options) == 4, f"Expected 4 options, got {len(questions[0].options)}"
