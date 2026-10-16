# quizMCB

Angular quiz app (`app/`) with questions imported from PDFs in `quiz/<Materia>/`.
Data lives in `app/public/data/<slug>.json` and `subjects.json`. UI text is in Italian.

## Importing questions

- Use the `parse-quiz-pdf` skill (`.claude/skills/parse-quiz-pdf`). Always run the Python scripts with `python -I`.
- Never edit question JSON by hand to add questions: go through `extract_pdf.py` then `merge_json.py`.
- If the user pastes questions as text instead of a PDF, build a fake PDF in `quiz/<Materia>/` following the PDF conventions of the skill (numbered questions, options `A.`-`D.`, correct option highlighted in fuchsia), then parse it normally.
- If the pasted text gives only the correct answer, write the three wrong options yourself, consistent with the correct letter.

## Hint and explanation (required for every question)

Every question must have both fields, written by Claude from its own knowledge:

- `hint`: shown during the quiz behind the "Mostra suggerimento" button. It must push the user to reason toward the answer without revealing it.
- `explanation`: shown in the final review ("Spiegazione"). It states why the answer is correct, and when useful why the others are not.

How to supply them: write `notes.json` as `{"<question number>": {"hint": "...", "explanation": "..."}}` and pass it to `merge_json.py --notes`. Re-running a merge keeps existing notes.

Questions without these fields are incomplete: when you notice any in the data files, add them. If the source's answer is debatable (e.g. a simplified textbook answer), keep the source's answer and mention the nuance in the explanation.

## Checks

From `app/`: `npx ng build` and `npx ng test --watch=false` (slow, run them in the background). Styles are in `src/styles.scss` (not `styles.css`).

## Git

Do not commit unless asked.
