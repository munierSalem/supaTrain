import numpy as np
import pandas as pd


class HeartrateZones:
    """
    A model that computes heartrate training zones based on user health metrics.
    Currently implements Training for the New Alpinism heartrate % thresholds.
    """

    # New Alpinism thresholds (zone lower bounds)
    # These are *percent of max heartrate*
    ZONE_PCT = {
        0: 0.0,
        1: 0.55,
        2: 0.75,
        3: 0.80,
        4: 0.90,
        5: 0.95,
    }

    def __init__(self, health_metrics: dict):
        """
        Parameters
        ----------
        health_metrics : dict
            Must include "max_heartrate".
        """
        self.health_metrics = health_metrics
        self._validate_health_metrics()
        self.zone_thresholds = self._compute_thresholds()

    def _validate_health_metrics(self):
        """Ensure max_heartrate exists and is sane."""
        if "max_heartrate" not in self.health_metrics:
            raise ValueError("health_metrics must include 'max_heartrate'.")

        max_heartrate = self.health_metrics["max_heartrate"]

        if not (1 <= max_heartrate <= 300):
            raise ValueError(f"max_heartrate must be between 1 and 300, got {max_heartrate}")

    def _compute_thresholds(self):
        """
        Compute absolute heartrate thresholds for each zone based on max heartrate.

        Returns
        -------
        dict : zone → lower bound heartrate
        """
        max_heartrate = self.health_metrics["max_heartrate"]
        return {zone: pct * max_heartrate for zone, pct in self.ZONE_PCT.items()}

    def get_zone(self, heartrate):
        """
        Compute the heartrate training zone for a scalar or array-like heartrate input.

        Parameters
        ----------
        heartrate : int, float, np.ndarray, or pd.Series

        Returns
        -------
        scalar or vector of zones (1–5)
        """

        # Prepare thresholds for vectorized compare
        # Example: array([hr_z1, hr_z2, hr_z3, hr_z4, hr_z5])
        thresholds = np.array(list(self.zone_thresholds.values()))

        # Normalize input → NumPy array
        heartrate_arr = np.asarray(heartrate)

        # Compute: zone = 1 + (# of thresholds heartrate exceeds)
        # Each heartrate_arr element gets compared to all thresholds.
        zone_idx = (heartrate_arr[..., None] >= thresholds).sum(axis=-1) - 1

        # Cap values in [0, 5]
        zones = np.clip(zone_idx, 0, 5)

        # Return same type as input
        if np.isscalar(heartrate):
            return int(zones)
        if isinstance(heartrate, pd.Series):
            return pd.Series(zones, index=heartrate.index)
        return zones
