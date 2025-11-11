import sys, json
from lib.metrics import compute_metrics

if __name__ == "__main__":
    activity_id = int(sys.argv[1])
    user_id = sys.argv[2]
    metrics = compute_metrics(activity_id, user_id)
    print(json.dumps(metrics))
