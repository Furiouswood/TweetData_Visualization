#!/usr/bin/env python3
"""Aggregate HateXplain target categories into chart-ready JSON."""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_CSV = ROOT / "project" / "clean_hateXplain.csv"
if not SOURCE_CSV.exists():
    SOURCE_CSV = ROOT / "clean_hateXplain.csv"
OUTPUT_JSON = ROOT / "data" / "category_counts.json"
OUTPUT_JS = ROOT / "data" / "category_counts.js"

CATEGORY_RULES = [
    {
        "column": "Race",
        "label": "Race",
        "empty_value": "No_race",
        "description": "Counts comments with a race target label.",
    },
    {
        "column": "Religion",
        "label": "Religion",
        "empty_value": "Nonreligious",
        "description": "Counts comments with a religion target label.",
    },
    {
        "column": "Gender",
        "label": "Gender",
        "empty_value": "No_gender",
        "description": "Counts comments with a gender target label.",
    },
    {
        "column": "Sexual Orientation",
        "label": "Sexual Orientation",
        "empty_value": "No_orientation",
        "description": "Counts comments with a sexual orientation target label.",
    },
    {
        "column": "Miscellaneous",
        "label": "Miscellaneous",
        "empty_value": "",
        "description": "Counts comments with a miscellaneous target label.",
    },
]


def load_counts() -> dict:
    counts = {rule["label"]: 0 for rule in CATEGORY_RULES}
    breakdowns = {rule["label"]: Counter() for rule in CATEGORY_RULES}
    total_comments = 0
    comments_with_multiple_targets = 0

    with SOURCE_CSV.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            total_comments += 1
            active_targets = 0

            for rule in CATEGORY_RULES:
                raw_value = (row.get(rule["column"]) or "").strip()
                if raw_value and raw_value != rule["empty_value"]:
                    counts[rule["label"]] += 1
                    breakdowns[rule["label"]][raw_value] += 1
                    active_targets += 1

            if active_targets > 1:
                comments_with_multiple_targets += 1

    return {
        "dataset": SOURCE_CSV.name,
        "totalComments": total_comments,
        "commentsWithMultipleTargets": comments_with_multiple_targets,
        "categories": [
            {
                "key": rule["label"].lower().replace(" ", "-"),
                "label": rule["label"],
                "count": counts[rule["label"]],
                "description": rule["description"],
                "breakdown": [
                    {"label": sub_label, "count": sub_count}
                    for sub_label, sub_count in breakdowns[rule["label"]].most_common()
                ],
            }
            for rule in CATEGORY_RULES
        ],
    }


def main() -> None:
    chart_data = load_counts()
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    json_payload = json.dumps(chart_data, indent=2)
    OUTPUT_JSON.write_text(json_payload, encoding="utf-8")
    OUTPUT_JS.write_text(
        f"window.HATEXPLAIN_COUNTS = {json_payload};\n",
        encoding="utf-8",
    )
    print(f"Wrote chart data to {OUTPUT_JSON}")
    print(f"Wrote browser-friendly data to {OUTPUT_JS}")


if __name__ == "__main__":
    main()
