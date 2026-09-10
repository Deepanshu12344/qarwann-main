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
    ("Andaman Qa..xlsx", "andaman-island-escape-beaches-blue-waters-island-stories", "/images/andaman/Andaman Main Photo.jpeg", "India"),
    ("Bali Qa..xlsx", "bali-island-of-gods-iconic-wonders-hidden-gems", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1800&q=85", "Indonesia"),
    ("Bhutan Qa..xlsx", "bhutan-himalayan-serenity-cultural-discovery", "/images/bhutan/bhutan-main.png", "Bhutan"),
    ("Goa_Qar..xlsx", "goa-coastal-charm-cultural-escape", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1800&q=85", "India"),
    ("Nepal Qa..xlsx", "nepal-himalayan-heritage-lakes-jungle-escape", "/images/nepal/Nepal Main Photo.avif", "Nepal"),
    ("Kerala Qa..xlsx", "kerala-serenity-escape", "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=85", "India"),
    ("Ladakh Qa.xlsx", "ladakh-himalayan-expedition", "/images/ladakh-cover.png", "India"),
    ("Rajasthan Qar..xlsx", "rajasthan-royal-heritage-desert-odyssey", "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85", "India"),
    ("Rishikesh Getaway Qa..xlsx", "rishikesh-reset-by-the-ganga-weekend-escape", "https://images.unsplash.com/photo-1609920658906-8223bd289001?auto=format&fit=crop&w=1800&q=85", "India"),
    ("Spiti Valley Qar..xlsx", "spiti-valley-expedition", "/images/spiti-cover.png", "India"),
]

# Starting prices are maintained here so regenerated itinerary data keeps the
# published destination pricing.
STARTING_PRICES = {
    "andaman-island-escape-beaches-blue-waters-island-stories": 39500,
    "bali-island-of-gods-iconic-wonders-hidden-gems": 39999,
    "bhutan-himalayan-serenity-cultural-discovery": 21999,
    "goa-coastal-charm-cultural-escape": 13500,
    "nepal-himalayan-heritage-lakes-jungle-escape": 24999,
    "kerala-serenity-escape": 13500,
    "ladakh-himalayan-expedition": 27999,
    "rajasthan-royal-heritage-desert-odyssey": 40000,
    "rishikesh-reset-by-the-ganga-weekend-escape": 0,
    "spiti-valley-expedition": 15999,
}

# Editorial image sets are deliberately grouped by the actual experience planned
# for each day.  They are kept here (rather than entered by hand in the generated
# TypeScript) so regenerating the workbook data never removes the day galleries.
IMAGE_LIBRARY = {
    "andaman-islands": [
        "/images/andaman/Andaman Main Photo.jpeg",
    ],
    "bhutan-himalayas": [
        "/images/bhutan/bhutan-main.png",
    ],
    "bali-island": [
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1800&q=85",
    ],
    "goa-heritage": [
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1800&q=85",
    ],
    "goa-coast": [
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1800&q=85",
    ],
    "goa-nature": [
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=85",
    ],
    "nepal-himalayas": [
        "/images/nepal/Nepal Main Photo.avif",
    ],
    "kerala-heritage": [
        "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1800&q=85",
    ],
    "kerala-hills": [
        "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1800&q=85",
    ],
    "kerala-wildlife": [
        "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
    ],
    "kerala-water": [
        "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85",
    ],
    "ladakh-town": [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=85",
    ],
    "ladakh-desert": [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
    ],
    "ladakh-lake": [
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=85",
    ],
    "rajasthan-palace": [
        "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1800&q=85",
    ],
    "rajasthan-desert": [
        "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1486911278844-a81c5267e227?auto=format&fit=crop&w=1800&q=85",
    ],
    "rajasthan-lake": [
        "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1800&q=85",
    ],
    "spiti-mountains": [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=85",
    ],
    "spiti-monastery": [
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=85",
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85",
    ],
    "rishikesh-riverside": [
        "https://images.unsplash.com/photo-1609920658906-8223bd289001?auto=format&fit=crop&w=1800&q=85",
    ],
}

DAY_IMAGE_THEMES = {
    "andaman-island-escape-beaches-blue-waters-island-stories": ["andaman-islands", "andaman-islands", "andaman-islands", "andaman-islands", "andaman-islands", "andaman-islands", "andaman-islands"],
    "bali-island-of-gods-iconic-wonders-hidden-gems": ["bali-island", "bali-island", "bali-island", "bali-island", "bali-island", "bali-island", "bali-island"],
    "bhutan-himalayan-serenity-cultural-discovery": ["bhutan-himalayas", "bhutan-himalayas", "bhutan-himalayas", "bhutan-himalayas", "bhutan-himalayas", "bhutan-himalayas", "bhutan-himalayas"],
    "goa-coastal-charm-cultural-escape": ["goa-heritage", "goa-heritage", "goa-coast", "goa-coast", "goa-nature", "goa-coast", "goa-heritage"],
    "nepal-himalayan-heritage-lakes-jungle-escape": ["nepal-himalayas", "nepal-himalayas", "nepal-himalayas", "nepal-himalayas", "nepal-himalayas", "nepal-himalayas", "nepal-himalayas", "nepal-himalayas"],
    "kerala-serenity-escape": ["kerala-heritage", "kerala-hills", "kerala-hills", "kerala-wildlife", "kerala-water", "kerala-water", "kerala-heritage"],
    "ladakh-himalayan-expedition": ["ladakh-town", "ladakh-town", "ladakh-desert", "ladakh-desert", "ladakh-lake", "ladakh-lake", "ladakh-town"],
    "rajasthan-royal-heritage-desert-odyssey": ["rajasthan-palace", "rajasthan-palace", "rajasthan-palace", "rajasthan-palace", "rajasthan-palace", "rajasthan-desert", "rajasthan-desert", "rajasthan-desert", "rajasthan-palace", "rajasthan-lake", "rajasthan-lake"],
    "rishikesh-reset-by-the-ganga-weekend-escape": ["rishikesh-riverside", "rishikesh-riverside", "rishikesh-riverside"],
    "spiti-valley-expedition": ["spiti-mountains", "spiti-mountains", "spiti-monastery", "spiti-monastery", "spiti-monastery", "spiti-mountains", "spiti-mountains"],
}

# Local day galleries use the supplied photography. Each list is the carousel
# sequence: e.g. day 1 starts with day1-1.jpeg.
LOCAL_DAY_IMAGES = {
    "andaman-island-escape-beaches-blue-waters-island-stories": {
        1: ["/images/andaman/daywise/day1-1.jpeg", "/images/andaman/daywise/day1-2.jpeg"],
        2: ["/images/andaman/daywise/day2-1.jpeg", "/images/andaman/daywise/day2-2.jpeg"],
        3: ["/images/andaman/daywise/day3-1.jpeg", "/images/andaman/daywise/day3-2.jpeg"],
        4: ["/images/andaman/daywise/day4-1.jpg", "/images/andaman/daywise/day4-2.jpeg"],
        5: ["/images/andaman/daywise/day5-1.jpeg", "/images/andaman/daywise/day5-2.jpeg"],
        6: ["/images/andaman/daywise/day6-1.jpeg", "/images/andaman/daywise/day6-2.jpeg"],
        7: ["/images/andaman/daywise/day7-1.jpeg", "/images/andaman/daywise/day7-2.jpeg"],
    },
    "bali-island-of-gods-iconic-wonders-hidden-gems": {
        1: ["/images/bali/daywise/day1-1.jpg", "/images/bali/daywise/day1-2.jpg"],
        2: ["/images/bali/daywise/day2-1.jpeg", "/images/bali/daywise/day2-2.jpeg"],
        3: ["/images/bali/daywise/day3-1.jpeg", "/images/bali/daywise/day3-2.jpeg"],
        4: ["/images/bali/daywise/day4-1.jpeg", "/images/bali/daywise/day4-2.jpeg"],
        5: ["/images/bali/daywise/day5-1.jpg", "/images/bali/daywise/day5-2.jpeg"],
        6: ["/images/bali/daywise/day6-1.jpeg", "/images/bali/daywise/day6-2.jpg"],
        7: ["/images/bali/daywise/day7-1.jpeg", "/images/bali/daywise/day7-2.jpeg"],
    },
    "bhutan-himalayan-serenity-cultural-discovery": {
        1: ["/images/bhutan/daywise/day1-1.jpeg", "/images/bhutan/daywise/day1-2.jpeg"],
        2: ["/images/bhutan/daywise/day2-1.jpeg", "/images/bhutan/daywise/day2-2.jpeg"],
        3: ["/images/bhutan/daywise/day3-1.jpeg", "/images/bhutan/daywise/day3-2.jpeg"],
        4: ["/images/bhutan/daywise/day4-1.jpeg", "/images/bhutan/daywise/day4-2.jpeg"],
        5: ["/images/bhutan/daywise/day5-1.jpeg", "/images/bhutan/daywise/day5-2.jpeg"],
        6: ["/images/bhutan/daywise/day6-1.jpeg", "/images/bhutan/daywise/day6-2.jpeg"],
        7: ["/images/bhutan/daywise/day7-1.jpeg", "/images/bhutan/daywise/day7-2.jpeg"],
    },
    "goa-coastal-charm-cultural-escape": {
        1: ["/images/goa/daywise/day1-1.jpeg", "/images/goa/daywise/day1-2.jpeg", "/images/goa/daywise/day1-3.jpeg", "/images/goa/daywise/day1-4.jpeg"],
        2: ["/images/goa/daywise/day2-1.jpeg", "/images/goa/daywise/day2-2.jpeg", "/images/goa/daywise/day2-3.jpeg"],
        3: ["/images/goa/daywise/day3-1.jpeg", "/images/goa/daywise/day3-2.jpeg"],
        4: ["/images/goa/daywise/day4-1.jpeg", "/images/goa/daywise/day4-2.jpeg"],
        5: ["/images/goa/daywise/day5-1.jpeg", "/images/goa/daywise/day5-2.jpeg", "/images/goa/daywise/day5-3.jpeg"],
        6: ["/images/goa/daywise/day6-1.jpeg", "/images/goa/daywise/day6-2.jpeg"],
        7: ["/images/goa/daywise/day7-1.jpeg", "/images/goa/daywise/day7-2.jpeg"],
    },
    "kerala-serenity-escape": {
        1: ["/images/kerala/daywise/day1-1.jpeg", "/images/kerala/daywise/day1-2.jpeg", "/images/kerala/daywise/day1-3.jpeg"],
        2: ["/images/kerala/daywise/day2-1.jpeg", "/images/kerala/daywise/day2-2.jpeg"],
        3: ["/images/kerala/daywise/day3-1.jpeg", "/images/kerala/daywise/day3-2.jpeg"],
        4: ["/images/kerala/daywise/day4-1.jpeg", "/images/kerala/daywise/day4-2.jpeg"],
        5: ["/images/kerala/daywise/day5-1.jpeg", "/images/kerala/daywise/day5-2.jpeg"],
        6: ["/images/kerala/daywise/day6-1.jpeg", "/images/kerala/daywise/day6-2.jpeg", "/images/kerala/daywise/day6-3.jpeg"],
        7: ["/images/kerala/daywise/day7-1.jpeg", "/images/kerala/daywise/day7-2.jpeg"],
    },
    "ladakh-himalayan-expedition": {
        1: ["/images/ladakh/daywise/day1-1.jpeg", "/images/ladakh/daywise/day1-2.jpeg"],
        2: ["/images/ladakh/daywise/day2-1.jpeg", "/images/ladakh/daywise/day2-2.jpeg", "/images/ladakh/daywise/day2-3.jpeg"],
        3: ["/images/ladakh/daywise/day3-1.jpeg", "/images/ladakh/daywise/day3-2.jpeg"],
        4: ["/images/ladakh/daywise/day4-1.jpeg", "/images/ladakh/daywise/day4-2.jpeg"],
        5: ["/images/ladakh/daywise/day5-1.jpeg", "/images/ladakh/daywise/day5-2.jpeg"],
        6: ["/images/ladakh/daywise/day6-1.jpeg", "/images/ladakh/daywise/day6-2.jpeg"],
        7: ["/images/ladakh/daywise/day7-1.jpeg", "/images/ladakh/daywise/day7-2.jpeg", "/images/ladakh/daywise/day7-3.jpeg"],
    },
    "nepal-himalayan-heritage-lakes-jungle-escape": {
        1: ["/images/nepal/daywise/day1-1.jpeg", "/images/nepal/daywise/day1-2.jpeg"],
        2: ["/images/nepal/daywise/day2-1.jpeg", "/images/nepal/daywise/day2-2.jpeg"],
        3: ["/images/nepal/daywise/day3-1.jpeg", "/images/nepal/daywise/day3-2.jpeg"],
        4: ["/images/nepal/daywise/day4-1.jpeg", "/images/nepal/daywise/day4-2.jpeg"],
        5: ["/images/nepal/daywise/day5-1.jpeg", "/images/nepal/daywise/day5-2.jpeg"],
        6: ["/images/nepal/daywise/day6-1.png", "/images/nepal/daywise/day6-2.jpeg"],
        7: ["/images/nepal/daywise/day7-1.jpeg", "/images/nepal/daywise/day7-2.jpg"],
        8: ["/images/nepal/daywise/day8-1.jpeg", "/images/nepal/daywise/day8-2.jpeg"],
    },
    "rajasthan-royal-heritage-desert-odyssey": {
        1: ["/images/rajasthan/daywise/day1-1.jpeg", "/images/rajasthan/daywise/day1-2.jpeg"],
        2: ["/images/rajasthan/daywise/day2-1.jpeg", "/images/rajasthan/daywise/day2-2.jpeg", "/images/rajasthan/daywise/day2-3.jpeg"],
        3: ["/images/rajasthan/daywise/day3-1.jpeg", "/images/rajasthan/daywise/day3-2.jpeg"],
        4: ["/images/rajasthan/daywise/day4-1.jpeg", "/images/rajasthan/daywise/day4-2.jpeg"],
        5: ["/images/rajasthan/daywise/day5-1.jpeg", "/images/rajasthan/daywise/day5-2.jpeg"],
        6: ["/images/rajasthan/daywise/day6-1.jpeg", "/images/rajasthan/daywise/day6-2.jpeg"],
        7: ["/images/rajasthan/daywise/day7-1.jpeg", "/images/rajasthan/daywise/day7-2.jpeg"],
        8: ["/images/rajasthan/daywise/day8-1.jpeg", "/images/rajasthan/daywise/day8-2.jpeg"],
        9: ["/images/rajasthan/daywise/day9-1.jpeg", "/images/rajasthan/daywise/day9-2.jpeg", "/images/rajasthan/daywise/day9-3.jpeg"],
        10: ["/images/rajasthan/daywise/day10-1.jpeg", "/images/rajasthan/daywise/day10-2.jpeg", "/images/rajasthan/daywise/day10-3.jpeg"],
        11: ["/images/rajasthan/daywise/day11-1.jpeg", "/images/rajasthan/daywise/day11-2.jpeg"],
    },
    "spiti-valley-expedition": {
        1: ["/images/spiti/daywise/day1-1.jpeg", "/images/spiti/daywise/day1-2.jpeg", "/images/spiti/daywise/day1-3.jpeg"],
        2: ["/images/spiti/daywise/day2-1.jpeg", "/images/spiti/daywise/day2-2.jpeg"],
        3: ["/images/spiti/daywise/day3-1.jpeg", "/images/spiti/daywise/day3-2.jpeg"],
        4: ["/images/spiti/daywise/day4-1.jpeg", "/images/spiti/daywise/day4-2.jpeg"],
        5: ["/images/spiti/daywise/day5-1.jpeg", "/images/spiti/daywise/day5-2.jpeg"],
        6: ["/images/spiti/daywise/day6-1.jpeg", "/images/spiti/daywise/day6-2.jpeg", "/images/spiti/daywise/day6-3.jpeg"],
        7: ["/images/spiti/daywise/day7-1.jpeg", "/images/spiti/daywise/day7-2.jpeg", "/images/spiti/daywise/day7-3.jpeg"],
    },
}


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


def festivals_or_na(value: str) -> list[str]:
    placeholders = {"", "-", "—", "n/a", "na"}
    festivals = [item for item in as_list(value) if item.strip().lower() not in placeholders]
    return festivals or ["N/A"]


def stay_or_departure(value: str) -> str:
    return "Departure" if value.strip().lower() in {"", "-", "—", "n/a", "na"} else value


def main() -> None:
    trips = []
    for filename, slug, cover, country in WORKBOOKS:
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
            theme = DAY_IMAGE_THEMES[slug][len(days)]
            images = LOCAL_DAY_IMAGES.get(slug, {}).get(day_number, IMAGE_LIBRARY[theme])
            days.append({
                "day": day_number, "route": row["Route"], "location": row["Location"], "phase": row["Phase"],
                "nature": as_bool(row["Nature"]), "adventure": as_bool(row["Adventure"]),
                "culture": as_bool(row["Culture"]), "spiritual": as_bool(row["Spiritual"]),
                "heritage": as_bool(row["Heritage"]), "modern": as_bool(row["Modern"]),
                "keyAttractions": as_list(row["Key Attractions"]), "experienceDetails": row["Experience Details"],
                "hiddenGems": as_list(row["Hidden Gems"]), "activities": as_list(row["Activities"]),
                "localFood": as_list(row["Local Food"]), "localExperience": row["Local Experience (Shopping / Interaction)"],
                "festivals": festivals_or_na(row["Festivals (if any)"]), "stayType": stay_or_departure(row["Stay Type"]),
                "accessibility": row["Accessibility (Road/Flight)"], "images": images,
            })
        duration = about["Duration"]
        days_match = re.search(r"(\d+)\s*Days?", duration, re.I)
        trips.append({
            "id": slug, "slug": slug, "packageName": about["Package Name"], "coverImage": cover,
            "country": country, "duration": duration, "durationDays": int(days_match.group(1)) if days_match else len(days),
            "citiesCovered": as_list(about["Cities Covered"]), "bestSeason": as_list(about["Best Season"]),
            "startPoint": about["Start Point"], "endPoint": about["End Point"],
            "tripType": about["Trip Type (Adventure / Leisure / Mixed)"], "idealFor": as_list(about["Ideal For"]),
            "budgetFrom": STARTING_PRICES[slug], "detailedOverview": about["Detailed Overview (150–200 words)"],
            "whyThisTrip": about["Why This Trip"], "keyExperiences": as_list(about["Key Experiences"]),
            "locationBanners": {}, "journeyDays": days,
        })
    output = "// Generated from the Qarwaan Excel workbooks. Run scripts/build-itineraries.py after updating them.\n"
    output += "export const QARWAAN_ITINERARIES = " + json.dumps(trips, ensure_ascii=False, indent=2) + " as const;\n"
    output += "\nexport type QarwaanItinerary = (typeof QARWAAN_ITINERARIES)[number];\n"
    (ROOT / "src/data/qarwaan-itineraries.ts").write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
