"""JSON question-bank and PDF worksheet exporters."""
from __future__ import annotations
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape
from .generator import Exercise


def export_question_bank(exercises: Iterable[Exercise], output: str | Path) -> Path:
    """Write exercises and corrections as a versioned UTF-8 JSON bank."""
    items = [item.to_dict() for item in exercises]
    if not items:
        raise ValueError("at least one exercise is required")
    destination = Path(output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(UTC).isoformat(),
        "count": len(items),
        "exercises": items,
    }
    destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return destination


def export_exercises_pdf(
    exercises: Iterable[Exercise],
    output: str | Path,
    *,
    include_corrections: bool = True,
) -> Path:
    """Create a printable PDF worksheet using ReportLab."""
    items = list(exercises)
    if not items:
        raise ValueError("at least one exercise is required")
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer
    except ImportError as exc:
        raise RuntimeError(
            "PDF export requires ReportLab. Install it with: pip install -r requirements-dev.txt"
        ) from exc

    destination = Path(output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Calcora — Fiche d'exercices", styles["Title"]),
        Spacer(1, 6 * mm),
        Paragraph(f"Nombre d'exercices : {len(items)}", styles["Normal"]),
        Spacer(1, 5 * mm),
    ]
    for index, item in enumerate(items, start=1):
        story.append(Paragraph(f"Exercice {index}", styles["Heading2"]))
        story.append(Paragraph(escape(item.prompt), styles["BodyText"]))
        story.append(Spacer(1, 4 * mm))
    if include_corrections:
        story.extend([PageBreak(), Paragraph("Corrigés", styles["Title"])])
        for index, item in enumerate(items, start=1):
            story.append(Paragraph(f"Correction {index}", styles["Heading2"]))
            story.append(Paragraph(escape(item.correction), styles["BodyText"]))
            story.append(Paragraph(f"Résultat : {escape(item.answer)}", styles["BodyText"]))
            story.append(Spacer(1, 4 * mm))
    document = SimpleDocTemplate(
        str(destination), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title="Calcora - Fiche d'exercices", author="Calcora",
    )
    document.build(story)
    return destination
