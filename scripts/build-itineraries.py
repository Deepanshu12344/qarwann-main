"""Build the public, static trip data from the supplied Qarwaan workbooks."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ROOT = Path(__file__).resolve().parents[1]
WORKBOOKS = [
    ("Goa_Qar..xlsx", "goa-coastal-charm-cultural-escape", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1800&q=85"),
    ("Kerala Qa..xlsx", "kerala-serenity-escape", "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=85"),
    ("Ladakh Qa.xlsx", "ladakh-himalayan-expedition", "/images/ladakh-cover.png"),
    ("Rajasthan Qar..xlsx", "rajasthan-royal-heritage-desert-odyssey", "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85"),
    ("Spiti Valley Qar..xlsx", "spiti-valley-expedition", "/images/spiti-cover.png"),
]


def column(reference: str) -> int:
    result = 0
    for character in re.match(r"[A-Z]+", reference).group(0):
        result = result * 26 + ord(character) - 64
    return result - 1


def sheet_rows(workbook: zipfile.ZipFile, number: int, strings: list[str]) -> list[list[str]]:
    root = ET.fromstring(workbook.read(f"xl/worksheets/sheet{number}.xml"))
    rows = []
    for row in root.findall(f".//{NS}row"):
        values: list[str] = []
        for cell in row.findall(f"{NS}c"):
            index = column(cell.attrib["r"])
            while len(values) <= index:
                values.append("")
            value = cell.find(f"{NS}v")
            text = "" if value is None else (value.text or "")
            values[index] = strings[int(text)] if cell.attrib.get("t") == "s" and text else text
        rows.append(values)
    return rows


def values_to_object(headers: list[str], row: list[str]) -> dict[str, str]:
    return {headers[index]: row[index] if index < len(row) else "" for index in range(len(headers))}


def as_list(value: str) -> list[str]:
    return [item.strip() for item in re.split(r"[,;|\n]", value) if item.strip()]


def as_bool(value: str) -> bool:
    return value.strip().lower() in {"yes", "y", "true", "1", "x", "✓", "tick", "✔"}


def main() -> None:
    trips = []
    for filename, slug, cover in WORKBOOKS:
        with zipfile.ZipFile(ROOT / filename) as workbook:
            strings_root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            strings = ["".join(item.itertext()) for item in strings_root.findall(f"{NS}si")]
            about_rows = sheet_rows(workbook, 1, strings)
            journey_rows = sheet_rows(workbook, 2, strings)
        about = values_to_object(about_rows[0], about_rows[1])
        journey_headers = journey_rows[0]
        days = []
        for raw_day in journey_rows[1:]:
            row = values_to_object(journey_headers, raw_day)
            day_number = int(re.sub(r"\D", "", row["Day"]) or "0")
            if not day_number:
                continue
            days.append({
                "day": day_number, "route": row["Route"], "location": row["Location"], "phase": row["Phase"],
                "nature": as_bool(row["Nature"]), "adventure": as_bool(row["Adventure"]),
                "culture": as_bool(row["Culture"]), "spiritual": as_bool(row["Spiritual"]),
                "heritage": as_bool(row["Heritage"]), "modern": as_bool(row["Modern"]),
                "keyAttractions": as_list(row["Key Attractions"]), "experienceDetails": row["Experience Details"],
                "hiddenGems": as_list(row["Hidden Gems"]), "activities": as_list(row["Activities"]),
                "localFood": as_list(row["Local Food"]), "localExperience": row["Local Experience (Shopping / Interaction)"],
                "festivals": as_list(row["Festivals (if any)"]), "stayType": row["Stay Type"],
                "accessibility": row["Accessibility (Road/Flight)"], "images": [],
            })
        duration = about["Duration"]
        days_match = re.search(r"(\d+)\s*Days?", duration, re.I)
        trips.append({
            "id": slug, "slug": slug, "packageName": about["Package Name"], "coverImage": cover,
            "country": "India", "duration": duration, "durationDays": int(days_match.group(1)) if days_match else len(days),
            "citiesCovered": as_list(about["Cities Covered"]), "bestSeason": as_list(about["Best Season"]),
            "startPoint": about["Start Point"], "endPoint": about["End Point"],
            "tripType": about["Trip Type (Adventure / Leisure / Mixed)"], "idealFor": as_list(about["Ideal For"]),
            "budgetFrom": 0, "detailedOverview": about["Detailed Overview (150–200 words)"],
            "whyThisTrip": about["Why This Trip"], "keyExperiences": as_list(about["Key Experiences"]),
            "locationBanners": {}, "journeyDays": days,
        })
    output = "// Generated from the Qarwaan Excel workbooks. Run scripts/build-itineraries.py after updating them.\n"
    output += "export const QARWAAN_ITINERARIES = " + json.dumps(trips, ensure_ascii=False, indent=2) + " as const;\n"
    output += "\nexport type QarwaanItinerary = (typeof QARWAAN_ITINERARIES)[number];\n"
    (ROOT / "src/data/qarwaan-itineraries.ts").write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
