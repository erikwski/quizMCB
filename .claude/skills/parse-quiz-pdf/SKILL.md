---
name: parse-quiz-pdf
description: Parse a quiz PDF (multiple choice, highlighted answers) from quiz/<Materia>/ into app/public/data/<materia>.json and mark the PDF as parsed. Use when the user adds a new quiz PDF or asks to import/update questions.
---

# parse-quiz-pdf

Imports questions from a quiz PDF into the per-subject JSON used by the Angular app, then flags the PDF `parsed: true` in the JSON `sources` array.

## PDF conventions
- Questions numbered `N.`, options `A.`-`D.`, one correct.
- Correct answer = PDF Highlight annotation on the option: **fuchsia** wins; if no fuchsia in that question, **orange**. (Highlights on the question number are only kept as `marks`, ignored for the answer.)
- No highlight at all -> Claude answers (use general knowledge; check notes in `../MCB` if useful) and the question is stored `answerSource: "claude"`, `verified: false`.

## Steps
1. Find PDFs: `quiz/<Materia>/*.pdf`. Subject name = folder name. Check `app/public/data/<slug>.json` `sources[]`; skip files with `parsed: true` (unless user asks to re-parse -> `--force`).
2. Extract (run from repo root `quizMCB/`, always `python -I`):
   `python -I .claude/skills/parse-quiz-pdf/scripts/extract_pdf.py "quiz/<Materia>/<file>.pdf" > <scratch>/extract.json`
3. Read JSON: `count`, `unresolved` (numbers without highlight), `anomalies`. Fix/ask the user if anomalies (wrong option count, ambiguous highlights, non-continuous numbering).
4. If `unresolved` not empty: answer each question, write `<scratch>/answers.json` = `{"<number>": "A".."D"}`.
5. Merge:
   `python -I .claude/skills/parse-quiz-pdf/scripts/merge_json.py --subject "<Materia>" --extract <scratch>/extract.json [--answers <scratch>/answers.json]`
   Writes `app/public/data/<slug>.json`, updates `subjects.json`, marks the source `parsed`. Refuses to write on any error.
6. Report: questions added, per-`answerSource` counts, anything `verified:false`.

Re-running is idempotent (deterministic ids `<slug>-<pdf-slug>-NN`).
