"""Extract multiple-choice questions + highlighted answers from a quiz PDF.

Usage: python -I extract_pdf.py <pdf>   -> JSON on stdout

Answer key lives in Highlight annotations: fuchsia = correct, orange = correct
only when no fuchsia highlight exists in that question.
"""
import json
import re
import sys

import pymupdf

FUCHSIA = (0.753, 0.216, 0.769)
ORANGE = (1.0, 0.384, 0.0)
Q_RE = re.compile(r"^\s*(\d+)\.\s+(.*\S)\s*$")
O_RE = re.compile(r"^\s*([A-D])\.\s+(.*\S)\s*$")
SKIP_RE = re.compile(r"^\s*(Pagina \d+|Domande .*Corso .*|Ognuna delle domande.*|\.?)\s*$")


def color_name(stroke):
    if not stroke:
        return None
    for name, ref in (("fuchsia", FUCHSIA), ("orange", ORANGE)):
        if all(abs(a - b) < 0.02 for a, b in zip(stroke, ref)):
            return name
    return None


def page_lines(page):
    out = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            text = "".join(s["text"] for s in l["spans"]).replace(" ", " ")
            out.append((l["bbox"][1], l["bbox"][3], text))
    return sorted(out)


def main(path):
    doc = pymupdf.open(path)
    questions = []
    anomalies = []
    cur = None  # current question dict
    last = None  # ("q",) or ("o", letter)

    for page in doc:
        lines = page_lines(page)
        line_owner = []  # (y0, y1, qnum, letter|None) for highlight lookup
        for y0, y1, text in lines:
            if SKIP_RE.match(text):
                continue
            mq, mo = Q_RE.match(text), O_RE.match(text)
            if mq:
                cur = {"number": int(mq.group(1)), "text": mq.group(2), "options": {}, "highlights": {}}
                questions.append(cur)
                last = None
                line_owner.append((y0, y1, cur, None))
            elif mo and cur is not None:
                cur["options"][mo.group(1)] = mo.group(2)
                last = mo.group(1)
                line_owner.append((y0, y1, cur, last))
            elif cur is not None:  # wrapped continuation
                if last is None:
                    cur["text"] += " " + text.strip()
                else:
                    cur["options"][last] += " " + text.strip()
                line_owner.append((y0, y1, cur, last))

        for annot in page.annots() or []:
            if annot.type[1] != "Highlight":
                continue
            name = color_name(annot.colors.get("stroke"))
            if name is None:
                anomalies.append(f"p{page.number + 1}: highlight colore sconosciuto {annot.colors}")
                continue
            verts = annot.vertices or []
            quads = [verts[i:i + 4] for i in range(0, len(verts), 4)]
            for quad in quads:
                yc = sum(p[1] for p in quad) / len(quad)
                hit = min(line_owner, key=lambda o: abs((o[0] + o[1]) / 2 - yc), default=None)
                if hit is not None and abs((hit[0] + hit[1]) / 2 - yc) > (hit[1] - hit[0]):
                    hit = None
                if hit is None:
                    anomalies.append(f"p{page.number + 1}: highlight {name} y={yc:.0f} senza riga")
                    continue
                _, _, q, letter = hit
                if letter is None:
                    # marker on the question line itself (number): kept as `mark`, not an answer
                    q.setdefault("marks", [])
                    if name not in q["marks"]:
                        q["marks"].append(name)
                    continue
                q["highlights"].setdefault(letter, [])
                if name not in q["highlights"][letter]:
                    q["highlights"][letter].append(name)

    for q in questions:
        fu = [k for k, v in q["highlights"].items() if "fuchsia" in v]
        orr = [k for k, v in q["highlights"].items() if "orange" in v]
        q["correct"], q["answerSource"] = None, None
        if len(fu) == 1:
            q["correct"], q["answerSource"] = fu[0], "highlight-fuchsia"
        elif len(fu) > 1:
            anomalies.append(f"domanda {q['number']}: piu fucsia {fu}")
        elif len(orr) == 1:
            q["correct"], q["answerSource"] = orr[0], "highlight-orange"
        elif len(orr) > 1:
            anomalies.append(f"domanda {q['number']}: piu arancio {orr}")
        if len(q["options"]) != 4:
            anomalies.append(f"domanda {q['number']}: {len(q['options'])} opzioni")
    nums = [q["number"] for q in questions]
    if nums != list(range(1, len(nums) + 1)):
        anomalies.append(f"numerazione non continua: {nums}")
    unresolved = [q["number"] for q in questions if q["correct"] is None]
    json.dump(
        {"file": path, "count": len(questions), "unresolved": unresolved, "anomalies": anomalies, "questions": questions},
        sys.stdout, ensure_ascii=False, indent=1,
    )


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1])
