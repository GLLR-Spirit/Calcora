import json
from pathlib import Path

from calcora.publication import build_public_resources


def test_public_site_resources_are_generated_and_linkable(tmp_path: Path) -> None:
    result = build_public_resources(tmp_path, Path("data/education-profiles.json"))
    catalog = json.loads(
        (tmp_path / "data/public/education-profiles.json").read_text(encoding="utf-8")
    )
    assert result["profile_count"] == 5
    assert catalog["statistics"]["status_counts"] == {"draft": 5, "verified": 0}
    for name in ("simple-average-easy", "weighted-average-medium"):
        bank = json.loads(
            (tmp_path / f"data/public/question-banks/{name}.json").read_text(encoding="utf-8")
        )
        assert bank["count"] == 10
        assert all(item["prompt"] and item["correction"] and item["answer"]
                   for item in bank["exercises"])
    for name in ("simple-average-practice-fr.pdf", "weighted-average-practice-fr.pdf"):
        pdf = (tmp_path / f"resources/{name}").read_bytes()
        assert pdf.startswith(b"%PDF-")
        assert len(pdf) > 1000
