from pathlib import Path
import json
import pandas as pd
from typing import Tuple, Dict, Any

def load_stream(activity_id: int, user_id: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Load a Strava stream JSON and return:
      - a tidy pandas DataFrame (columns like lat, lon, time, altitude, etc.)
      - the raw parsed dict for debugging or secondary use
    """
    path = Path(__file__).resolve().parents[2] / "data" / "streams" / user_id / f"{activity_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Stream JSON not found for activity {activity_id}: {path}")

    with open(path) as f:
        raw_data = json.load(f)

    data: Dict[str, list] = {}
    for k, v in raw_data.items():
        if "data" not in v:
            continue  # skip weird keys (metadata, empty objects, etc.)

        if k == "latlng":
            latlng = v.get("data", [])
            data["lat"] = [p[0] for p in latlng]
            data["lon"] = [p[1] for p in latlng]
        else:
            data[k] = v["data"]

    df = pd.DataFrame(data)
    if "time" in df.columns:
        df = df.sort_values("time").reset_index(drop=True)
    return df, raw_data
