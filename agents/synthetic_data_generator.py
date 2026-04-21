"""
DeepTrace — Synthetic Training Data Generator (Phase 5)
Generates synthetic piracy detection data for training the predictive model.
Simulates realistic piracy patterns across platforms, regions, and time periods.
"""

import os
import random
import json
import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional


def generate_training_data(num_records: int = 5000) -> list[dict]:
    """
    Generate synthetic historical detection data that simulates real piracy patterns:
    - Higher activity during major sports events
    - Platform-specific distribution
    - Geographic clustering (South Asia, MENA, South America)
    - Time-of-day patterns (evening peak)
    """
    random.seed(42)

    platforms = {
        "Telegram": 0.30,
        "YouTube": 0.25,
        "TikTok": 0.15,
        "Discord": 0.10,
        "Twitter/X": 0.08,
        "Facebook": 0.07,
        "Instagram": 0.05,
    }

    regions = {
        "IN": 0.25, "PK": 0.10, "BD": 0.05,
        "AE": 0.08, "SA": 0.05,
        "GB": 0.10, "US": 0.07,
        "TR": 0.05, "NG": 0.04,
        "BR": 0.06, "AR": 0.04,
        "DE": 0.04, "FR": 0.03,
        "ID": 0.04,
    }

    sports = {
        "Cricket": 0.35,
        "Football": 0.35,
        "Basketball": 0.10,
        "Tennis": 0.08,
        "Boxing/MMA": 0.07,
        "F1": 0.05,
    }

    major_events = [
        {"name": "IPL", "sport": "Cricket", "months": [3, 4, 5], "multiplier": 3.0},
        {"name": "Premier League", "sport": "Football", "months": [8, 9, 10, 11, 12, 1, 2, 3, 4, 5], "multiplier": 2.0},
        {"name": "Champions League", "sport": "Football", "months": [2, 3, 4, 5], "multiplier": 2.5},
        {"name": "FIFA World Cup", "sport": "Football", "months": [6, 7], "multiplier": 5.0},
        {"name": "NBA Playoffs", "sport": "Basketball", "months": [4, 5, 6], "multiplier": 2.0},
        {"name": "Grand Slam", "sport": "Tennis", "months": [1, 5, 6, 7, 8, 9], "multiplier": 1.5},
    ]

    data = []
    base_date = datetime(2023, 1, 1, tzinfo=timezone.utc)

    for _ in range(num_records):
        # Random date in the past 18 months
        days_offset = random.randint(0, 540)
        hours_offset = random.randint(0, 23)

        # Time-of-day bias (evening peak 18:00-23:00)
        hour_weights = [0.02] * 6 + [0.03] * 6 + [0.05] * 6 + [0.12, 0.14, 0.15, 0.15, 0.13, 0.10]
        hour = random.choices(range(24), weights=hour_weights[:24])[0]

        timestamp = base_date + timedelta(days=days_offset, hours=hour)

        # Platform selection (weighted)
        platform = random.choices(
            list(platforms.keys()),
            weights=list(platforms.values()),
        )[0]

        # Region
        region = random.choices(
            list(regions.keys()),
            weights=list(regions.values()),
        )[0]

        # Sport
        sport = random.choices(
            list(sports.keys()),
            weights=list(sports.values()),
        )[0]

        # Check if during a major event
        event_multiplier = 1.0
        active_event = None
        for event in major_events:
            if event["sport"] == sport and timestamp.month in event["months"]:
                event_multiplier = event["multiplier"]
                active_event = event["name"]
                break

        # Confidence score (higher during major events)
        base_confidence = random.gauss(0.88, 0.08)
        confidence = min(0.99, max(0.50, base_confidence))

        # Estimated views (log-normal distribution)
        views = int(random.lognormvariate(8, 2))

        # Enforcement outcome
        enforcement_outcomes = {
            "takedown_successful": 0.45,
            "takedown_pending": 0.20,
            "appeal_filed": 0.10,
            "content_removed_voluntarily": 0.15,
            "no_action": 0.10,
        }
        outcome = random.choices(
            list(enforcement_outcomes.keys()),
            weights=list(enforcement_outcomes.values()),
        )[0]

        record = {
            "detection_id": str(uuid.uuid4()),
            "timestamp": timestamp.isoformat(),
            "platform": platform,
            "region": region,
            "sport": sport,
            "event": active_event,
            "event_multiplier": event_multiplier,
            "confidence_score": round(confidence, 4),
            "estimated_views": views,
            "hour_of_day": hour,
            "day_of_week": timestamp.weekday(),
            "month": timestamp.month,
            "enforcement_outcome": outcome,
            "response_time_minutes": random.randint(1, 120),
            "watermark_survived": random.random() < 0.82,
        }
        data.append(record)

    return data


def save_training_data(data: list[dict], output_path: str = "data/training_data.json"):
    """Save training data to JSON."""
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Saved {len(data)} records to {output_path}")


def generate_and_save(num_records: int = 5000, base_path: str = "."):
    """Generate training data and save as both JSON and CSV."""
    data = generate_training_data(num_records)

    # JSON
    json_path = f"{base_path}/data/training_data.json"
    save_training_data(data, json_path)

    # CSV
    csv_path = f"{base_path}/data/training_data.csv"
    import os
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    print(f"✅ Saved {len(data)} records to {csv_path}")

    # Stats
    platforms = {}
    for record in data:
        p = record["platform"]
        platforms[p] = platforms.get(p, 0) + 1

    print(f"\n📊 Platform distribution:")
    for p, count in sorted(platforms.items(), key=lambda x: -x[1]):
        print(f"   {p}: {count} ({count/len(data)*100:.1f}%)")

    return data


if __name__ == "__main__":
    generate_and_save(5000, base_path=os.path.dirname(os.path.abspath(__file__)) + "/..")
