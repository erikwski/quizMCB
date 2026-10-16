"""Merge extract_pdf.py output into the per-subject quiz JSON and mark the PDF parsed.

Usage:
  python -I merge_json.py --subject "Scienze di base" --extract out.json \
      [--answers answers.json] [--data-dir app/public/data] [--force]

answers.json: {"<question number>": "A".."D"} for questions with no highlight
(answered by Claude -> answerSource "claude", verified false).
Idempotent: question ids are deterministic; a source already `parsed` is skipped unless --force.
"""
import argparse
import datetime
import json
import os
import re
import sys
import unicodedata


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def load(path, default):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def save(path, data):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject", required=True)
    ap.add_argument("--extract", required=True)
    ap.add_argument("--answers")
    ap.add_argument("--data-dir", default="app/public/data")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    with open(a.extract, encoding="utf-8") as f:
        ext = json.load(f)
    answers = load(a.answers, {}) if a.answers else {}

    slug = slugify(a.subject)
    src_file = ext["file"].replace("\\", "/")
    src_slug = slugify(os.path.splitext(os.path.basename(src_file))[0])
    os.makedirs(a.data_dir, exist_ok=True)
    path = os.path.join(a.data_dir, f"{slug}.json")
    data = load(path, {"subject": a.subject, "slug": slug, "sources": [], "questions": []})

    existing = next((s for s in data["sources"] if s["file"] == src_file), None)
    if existing and existing.get("parsed") and not a.force:
        print(f"SKIP: {src_file} gia parsed")
        return

    problems = []
    new = []
    for q in ext["questions"]:
        correct, source, verified = q["correct"], q["answerSource"], True
        if correct is None:
            correct = answers.get(str(q["number"]))
            source, verified = "claude", False
        if correct not in q["options"] or len(q["options"]) != 4:
            problems.append(f"domanda {q['number']}: risposta/opzioni non valide")
            continue
        new.append({
            "id": f"{slug}-{src_slug}-{q['number']:02d}",
            "source": src_file,
            "number": q["number"],
            "text": q["text"],
            "options": q["options"],
            "correct": correct,
            "answerSource": source,
            "verified": verified,
        })
    if problems or ext["anomalies"]:
        print("ERRORI (nessuna scrittura):", *problems, *ext["anomalies"], sep="\n  ")
        sys.exit(1)

    ids = {q["id"] for q in new}
    data["questions"] = [q for q in data["questions"] if q["id"] not in ids] + new
    data["sources"] = [s for s in data["sources"] if s["file"] != src_file] + [{
        "file": src_file, "parsed": True,
        "parsedAt": datetime.date.today().isoformat(), "questionCount": len(new),
    }]
    save(path, data)

    manifest_path = os.path.join(a.data_dir, "subjects.json")
    manifest = [m for m in load(manifest_path, []) if m["slug"] != slug]
    manifest.append({"slug": slug, "name": a.subject, "file": f"{slug}.json"})
    save(manifest_path, sorted(manifest, key=lambda m: m["name"]))
    by_src = {}
    for q in new:
        by_src[q["answerSource"]] = by_src.get(q["answerSource"], 0) + 1
    print(f"OK: {len(new)} domande da {src_file}; totale {len(data['questions'])}; {by_src}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
