#!/usr/bin/env python3
"""Normalize the curated ingredient workbook and synchronize catalog artifacts."""

from __future__ import annotations

import argparse
import csv
import math
import re
from datetime import datetime, timedelta
from pathlib import Path, PurePosixPath
from typing import Iterable
from xml.etree import ElementTree as ET
from zipfile import ZipFile


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

INGREDIENT_FIELDS = [
    "full_name_ingredient", "name_ingredient_ru", "format_ingredient_ru", "category_ru",
    "ingredient_format_cat", "calories_kcal", "moisture_per", "protein_per",
    "carbohydrate_per", "fats_per", "ash_g", "fiber_g", "cholesterol_mg",
    "total_sugar_g", "calcium_mg", "phosphorus_mg", "magnesium_mg", "sodium_mg",
    "potassium_mg", "iron_mg", "copper_mg", "zinc_mg", "manganese_mg",
    "selenium_mcg", "iodine_mcg", "choline_mg", "vitamin_a_mcg", "vitamin_e_mg",
    "vitamin_d_mcg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg",
    "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg",
    "vitamin_c_mg", "vitamin_k_mcg", "alpha_carotene_mcg", "beta_carotene_mcg",
    "beta_cryptoxanthin_mcg", "lutein_zeaxanthin_mcg", "lycopene_mcg", "retinol_mcg",
    "linoleic_acid_g", "alpha_linolenic_acid_g", "arachidonic_acid_g", "epa_g", "dha_g",
]

SNAPSHOT_FIELDS = [
    "source_row", "source_full_name", "match_name_ingredient_ru", "match_format_ingredient_ru",
] + INGREDIENT_FIELDS

WORKBOOK_TO_DATASET = {
    "calories_kcal": "calories_kcal",
    "moisture_per": "moisture_per",
    "protein_per": "protein_per",
    "carbohydrate_per": "carbohydrate_per",
    "fats_per": "fats_per",
    "ash_g": "ash_g",
    "fiber_g": "fiber_g",
    "calcium_mg": "calcium_mg",
    "phosphorus_mg": "phosphorus_mg",
    "magnesium_mg": "magnesium_mg",
    "sodium_mg": "sodium_mg",
    "potassium_mg": "potassium_mg",
    "iron_mg": "iron_mg",
    "copper_mg": "copper_mg",
    "zinc_mg": "zinc_mg",
    "manganese_mg": "manganese_mg",
    "selenium_mcg": "selenium_mcg",
    "iodine_mcg": "iodine_mcg",
    "choline_mg": "choline_mg",
    "vitamin_a_mcg": "vitamin_a_mcg",
    "vitamin_e_mg": "vitamin_e_mg",
    "vitamin_d_mcg": "vitamin_d_mcg",
    "vitamin_b1_mg": "vitamin_b1_mg",
    "vitamin_b2_mg": "vitamin_b2_mg",
    "vitamin_b3_mg": "vitamin_b3_mg",
    "vitamin_b5_mg": "vitamin_b5_mg",
    "vitamin_b6_mg": "vitamin_b6_mg",
    "vitamin_b9_mcg": "vitamin_b9_mcg",
    "vitamin_b12_mcg": "vitamin_b12_mcg",
    "vitamin_c_mg": "vitamin_c_mg",
    "linoleic_acid_g": "linoleic_acid_g",
    "alpha_linolenic_acid_g": "alpha_linolenic_acid_g",
    "arachidonic_acid_g": "arachidonic_acid_g",
    "epa_g": "epa_g",
    "dha_g": "dha_g",
}

ALIASES = {
    "Coconut oil": "VEGETABLE OIL,COCONUT",
    "Olive oil": "OIL,OLIVE,SALAD OR COOKING",
    "Flaxseed": "SEEDS,FLAXSEED",
    "Sunflower seeds": "SUNFLOWER SD KRNLS,DRIED",
    "Pumpkin seeds": "PUMPKIN&SQUASH SD KRNLS,DRIED",
}

EXISTING_IDENTITIES = {
    "Coconut oil": ("Растительное Масло", "Кокосовое"),
    "Olive oil": ("Растительное Масло", "Оливковое"),
    "Flaxseed": ("Семена", "Льна"),
    "Sunflower seeds": ("Семена", "Подсолнечника"),
    "Pumpkin seeds": ("Семена", "Тыквы и кабочка"),
    "CHICKEN,BROILERS OR FRYERS,FAT,RAW": ("Животный Жир", "Куринный"),
}

ZERO_CARBOHYDRATE_SENTINELS = {
    "Veal brisket bone",
    "Lamb rib",
    "Beef cartilage",
}

PERCENT_FIELDS = {
    "moisture_per", "protein_per", "carbohydrate_per", "fats_per", "ash_g", "fiber_g",
}

DB_FIELDS = {
    "category": "category_ru",
    "name": "name_ingredient_ru",
    "subtype": "format_ingredient_ru",
    "calories": "calories_kcal",
    "protein": "protein_per",
    "fat": "fats_per",
    "carbs": "carbohydrate_per",
    "moisture": "moisture_per",
    "fiber": "fiber_g",
    "ash": "ash_g",
    "cholesterol": "cholesterol_mg",
    "sugar": "total_sugar_g",
    "calcium": "calcium_mg",
    "phosphorus": "phosphorus_mg",
    "magnesium": "magnesium_mg",
    "sodium": "sodium_mg",
    "potassium": "potassium_mg",
    "iron": "iron_mg",
    "copper": "copper_mg",
    "zinc": "zinc_mg",
    "manganese": "manganese_mg",
    "linoleic": "linoleic_acid_g",
    "alpha_linolenic": "alpha_linolenic_acid_g",
    "arachidonic": "arachidonic_acid_g",
    "epa": "epa_g",
    "dha": "dha_g",
    "choline": "choline_mg",
    "selenium": "selenium_mcg",
    "iodine": "iodine_mcg",
    "vitamin_a": "vitamin_a_mcg",
    "vitamin_e": "vitamin_e_mg",
    "vitamin_d": "vitamin_d_mcg",
    "vitamin_b1": "vitamin_b1_mg",
    "vitamin_b2": "vitamin_b2_mg",
    "vitamin_b3": "vitamin_b3_mg",
    "vitamin_b5": "vitamin_b5_mg",
    "vitamin_b6": "vitamin_b6_mg",
    "vitamin_b9": "vitamin_b9_mcg",
    "vitamin_b12": "vitamin_b12_mcg",
    "vitamin_c": "vitamin_c_mg",
    "vitamin_k": "vitamin_k_mcg",
    "alpha_carotene": "alpha_carotene_mcg",
    "beta_carotene": "beta_carotene_mcg",
    "beta_cryptoxanthin": "beta_cryptoxanthin_mcg",
    "lutein_zeaxanthin": "lutein_zeaxanthin_mcg",
    "lycopene": "lycopene_mcg",
    "retinol": "retinol_mcg",
}


def normalized_key(value: str) -> str:
    return " ".join(value.strip().casefold().split())


def excel_serial_as_decimal(raw_value: str) -> float:
    displayed = datetime(1899, 12, 30) + timedelta(days=float(raw_value))
    return float(f"{displayed.day}.{displayed.month}")


def _shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in item.iterfind(f".//{{{MAIN_NS}}}t"))
        for item in root.findall(f"{{{MAIN_NS}}}si")
    ]


def _date_style_indexes(archive: ZipFile) -> set[int]:
    root = ET.fromstring(archive.read("xl/styles.xml"))
    custom_node = root.find(f"{{{MAIN_NS}}}numFmts")
    custom = {
        int(node.attrib["numFmtId"]): node.attrib["formatCode"]
        for node in (list(custom_node) if custom_node is not None else [])
    }
    styles = list(root.find(f"{{{MAIN_NS}}}cellXfs") or [])
    result = set()
    for index, style in enumerate(styles):
        code = custom.get(int(style.attrib.get("numFmtId", 0)), "").lower()
        if "d" in code and "m" in code:
            result.add(index)
    return result


def read_workbook(path: Path) -> list[dict[str, str | float]]:
    with ZipFile(path) as archive:
        shared = _shared_strings(archive)
        date_styles = _date_style_indexes(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
        sheet = next(iter(workbook.find(f"{{{MAIN_NS}}}sheets") or []), None)
        if sheet is None:
            raise ValueError("Workbook has no worksheets")
        relation_id = sheet.attrib[f"{{{REL_NS}}}id"]
        worksheet_path = str(PurePosixPath("xl") / targets[relation_id])
        worksheet = ET.fromstring(archive.read(worksheet_path))

        raw_rows: list[dict[str, str | float]] = []
        for row in worksheet.findall(f".//{{{MAIN_NS}}}sheetData/{{{MAIN_NS}}}row"):
            values: dict[str, str | float] = {}
            for cell in row.findall(f"{{{MAIN_NS}}}c"):
                column = re.match(r"[A-Z]+", cell.attrib["r"])
                if column is None:
                    continue
                value_node = cell.find(f"{{{MAIN_NS}}}v")
                cell_type = cell.attrib.get("t")
                if cell_type == "inlineStr":
                    value: str | float = "".join(
                        item.text or "" for item in cell.iterfind(f".//{{{MAIN_NS}}}t")
                    )
                elif value_node is None:
                    value = ""
                elif cell_type == "s":
                    value = shared[int(value_node.text or "0")]
                elif int(cell.attrib.get("s", 0)) in date_styles:
                    value = excel_serial_as_decimal(value_node.text or "0")
                else:
                    value = value_node.text or ""
                values[column.group()] = value
            raw_rows.append(values)

    if not raw_rows:
        raise ValueError("Workbook is empty")
    headers = {column: str(value).strip() for column, value in raw_rows[0].items()}
    return [
        {headers[column]: value for column, value in row.items() if headers.get(column)}
        for row in raw_rows[1:]
        if any(str(value).strip() for value in row.values())
    ]


def _number(value: object, row_number: int, field: str) -> float:
    try:
        number = float(value or 0)
    except (TypeError, ValueError) as error:
        raise ValueError(f"row {row_number}: {field} is not numeric: {value!r}") from error
    if not math.isfinite(number) or number < 0:
        raise ValueError(f"row {row_number}: {field} must be finite and non-negative")
    if field in PERCENT_FIELDS and number > 100:
        raise ValueError(f"row {row_number}: {field} exceeds 100")
    if field == "calories_kcal" and number > 2000:
        raise ValueError(f"row {row_number}: calories_kcal exceeds 2000")
    if number > 1_000_000:
        raise ValueError(f"row {row_number}: {field} exceeds the supported safety limit")
    return round(number, 6)


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_rows(
    workbook_rows: Iterable[dict[str, str | float]],
    current_rows: Iterable[dict[str, str]],
) -> list[dict[str, str | float | int]]:
    current_by_full = {normalized_key(row["full_name_ingredient"]): row for row in current_rows}
    normalized: list[dict[str, str | float | int]] = []
    seen_sources: set[str] = set()
    seen_canonical: set[str] = set()

    for source_row, source in enumerate(workbook_rows, start=2):
        source_full = str(source.get("full_name_ingredient", "")).strip()
        name = str(source.get("name_ru", "")).strip()
        subtype = str(source.get("format_ru", "")).strip()
        category = str(source.get("category", "")).strip()
        if not all((source_full, name, subtype, category)):
            raise ValueError(f"row {source_row}: identity fields must not be blank")
        source_key = normalized_key(source_full)
        if source_key in seen_sources:
            raise ValueError(f"row {source_row}: duplicate source full name {source_full!r}")
        seen_sources.add(source_key)

        canonical_full = ALIASES.get(source_full, source_full)
        canonical_key = normalized_key(canonical_full)
        if canonical_key in seen_canonical:
            raise ValueError(f"row {source_row}: duplicate canonical full name {canonical_full!r}")
        seen_canonical.add(canonical_key)
        existing = current_by_full.get(canonical_key)
        if source_full in ALIASES and existing is None:
            raise ValueError(f"row {source_row}: alias target {canonical_full!r} is missing")

        match_name, match_subtype = EXISTING_IDENTITIES.get(
            source_full,
            (
                existing["name_ingredient_ru"] if existing else name,
                existing["format_ingredient_ru"] if existing else subtype,
            ),
        )
        item: dict[str, str | float | int] = {
            "source_row": source_row,
            "source_full_name": source_full,
            "full_name_ingredient": canonical_full,
            "name_ingredient_ru": name,
            "format_ingredient_ru": subtype,
            "category_ru": category,
            "ingredient_format_cat": f"{name} — {subtype}",
            "match_name_ingredient_ru": match_name,
            "match_format_ingredient_ru": match_subtype,
        }
        for field in INGREDIENT_FIELDS:
            if field in item:
                continue
            workbook_field = WORKBOOK_TO_DATASET.get(field)
            raw_value = source.get(workbook_field, 0) if workbook_field else 0
            if (
                field == "carbohydrate_per"
                and source_full in ZERO_CARBOHYDRATE_SENTINELS
                and float(raw_value or 0) == -1
            ):
                raw_value = 0
            item[field] = _number(raw_value, source_row, field) if workbook_field else 0.0

        if item["calories_kcal"] == 0 and any(
            item[field] > 0 for field in ("protein_per", "fats_per", "carbohydrate_per")
        ):
            item["calories_kcal"] = round(
                3.5 * float(item["protein_per"])
                + 8.5 * float(item["fats_per"])
                + 3.5 * float(item["carbohydrate_per"]),
                6,
            )
        normalized.append(item)

    if len(normalized) != 79:
        raise ValueError(f"expected 79 curated rows, found {len(normalized)}")
    return normalized


def write_csv(path: Path, fields: list[str], rows: Iterable[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def merge_ingredients(current_rows: list[dict[str, str]], curated: list[dict[str, object]]) -> list[dict[str, object]]:
    curated_by_full = {normalized_key(str(row["full_name_ingredient"])): row for row in curated}
    result: list[dict[str, object]] = []
    consumed: set[str] = set()
    for row in current_rows:
        key = normalized_key(row["full_name_ingredient"])
        replacement = curated_by_full.get(key)
        if replacement:
            result.append({field: replacement[field] for field in INGREDIENT_FIELDS})
            consumed.add(key)
        else:
            result.append(row)
    result.extend(
        {field: row[field] for field in INGREDIENT_FIELDS}
        for key, row in curated_by_full.items()
        if key not in consumed
    )
    keys = [normalized_key(str(row["full_name_ingredient"])) for row in result]
    if len(keys) != len(set(keys)):
        raise ValueError("merged recommender catalog contains duplicate full names")
    return result


def merge_mapping(current_rows: list[dict[str, str]], curated: list[dict[str, object]]) -> list[dict[str, object]]:
    result: list[dict[str, object]] = list(current_rows)
    existing = {
        (normalized_key(row["name_feed_ingredient"]), normalized_key(row["full_name_ingredient"]))
        for row in current_rows
    }
    for row in curated:
        key = (normalized_key(str(row["source_full_name"])), normalized_key(str(row["full_name_ingredient"])))
        if key not in existing:
            result.append({
                "name_feed_ingredient": str(row["source_full_name"]).casefold(),
                "full_name_ingredient": row["full_name_ingredient"],
                "category_ru": row["category_ru"],
            })
            existing.add(key)
    return result


def _sql_text(value: object) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def generate_migration(curated: list[dict[str, object]]) -> str:
    db_columns = list(DB_FIELDS)
    source_columns = ["source_row", "match_name", "match_subtype"] + db_columns
    values = []
    for row in curated:
        fields: list[str] = [
            str(row["source_row"]),
            _sql_text(row["match_name_ingredient_ru"]),
            _sql_text(row["match_format_ingredient_ru"]),
        ]
        for column in db_columns:
            value = row[DB_FIELDS[column]]
            fields.append(_sql_text(value) if column in {"category", "name", "subtype"} else str(value))
        values.append("    (" + ", ".join(fields) + ")")

    assignments = [
        "category = source.category", "name = source.name", "subtype = source.subtype",
        "recommender_supported = TRUE",
    ] + [f"{column} = source.{column}" for column in db_columns if column not in {"category", "name", "subtype"}]
    assignments.append("updated_at = NOW()")
    insert_columns = ["category", "name", "subtype", "recommender_supported", "owner_id", "portion"] + [
        column for column in db_columns if column not in {"category", "name", "subtype"}
    ] + ["created_at", "updated_at"]
    select_values = ["source.category", "source.name", "source.subtype", "TRUE", "NULL", "100"] + [
        f"source.{column}" for column in db_columns if column not in {"category", "name", "subtype"}
    ] + ["NOW()", "NOW()"]
    values_sql = ",\n".join(values)
    assignments_sql = ",\n        ".join(assignments)

    return f"""-- Generated from data/additional_ingredients.csv. Do not hand-edit data rows.
WITH source ({', '.join(source_columns)}) AS (
    VALUES
{values_sql}
), updated AS (
    UPDATE pets.ingredients AS ingredient
    SET {assignments_sql}
    FROM source
    WHERE ingredient.owner_id IS NULL
      AND lower(ingredient.name) = lower(source.match_name)
      AND lower(coalesce(ingredient.subtype, '')) = lower(source.match_subtype)
    RETURNING source.source_row
)
INSERT INTO pets.ingredients ({', '.join(insert_columns)})
SELECT {', '.join(select_values)}
FROM source
WHERE NOT EXISTS (SELECT 1 FROM updated WHERE updated.source_row = source.source_row)
  AND NOT EXISTS (
      SELECT 1 FROM pets.ingredients AS ingredient
      WHERE ingredient.owner_id IS NULL
        AND lower(ingredient.name) = lower(source.name)
        AND lower(coalesce(ingredient.subtype, '')) = lower(source.subtype)
  );
"""


def run(args: argparse.Namespace) -> None:
    current = load_csv(args.ingredients)
    workbook_rows = read_workbook(args.workbook)
    curated = normalize_rows(workbook_rows, current)
    write_csv(args.snapshot, SNAPSHOT_FIELDS, curated)
    write_csv(args.ingredients, INGREDIENT_FIELDS, merge_ingredients(current, curated))
    mapping = load_csv(args.mapping)
    write_csv(args.mapping, ["name_feed_ingredient", "full_name_ingredient", "category_ru"], merge_mapping(mapping, curated))
    args.migration.write_text(generate_migration(curated), encoding="utf-8")


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parents[1]
    result.add_argument("workbook", type=Path)
    result.add_argument("--snapshot", type=Path, default=root / "data/additional_ingredients.csv")
    result.add_argument("--ingredients", type=Path, default=root / "data/ingredients_data.csv")
    result.add_argument("--mapping", type=Path, default=root / "data/mapping_ingredients.csv")
    result.add_argument("--migration", type=Path, required=True)
    return result


if __name__ == "__main__":
    run(parser().parse_args())
