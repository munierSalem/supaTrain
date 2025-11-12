import argparse, json, sys, uuid
from lib.metrics import compute_metrics


def validate_uuid(value: str) -> str:
    """
    Validate that the provided string is a valid UUID4/UUID format.
    Returns the same string if valid, raises argparse.ArgumentTypeError if not.
    """
    try:
        uuid_obj = uuid.UUID(value)
        return str(uuid_obj)
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid UUID format: {value}")


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("--activity_id", type=int, required=True)
    parser.add_argument("--user_id", type=validate_uuid, required=True)
    args = parser.parse_args()

    metrics = compute_metrics(args.activity_id, args.user_id)
    print(json.dumps(metrics))
