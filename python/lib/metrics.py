from datetime import datetime
from .io import load_stream

def compute_metrics(activity_id: int, user_id: str) -> dict:
    df = load_stream(activity_id, user_id)
    # do stuff here
    return {
        "analyzed_at": datetime.utcnow().isoformat(),
    }
