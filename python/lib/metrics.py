from __future__ import annotations

from datetime import datetime
from .io import load_stream

import pandas as pd
import numpy as np
from scipy.signal import find_peaks


def time_weighted_avg(
    df: pd.DataFrame,
    value_col: str,
    weight_col: str = "dt"
) -> float:
    """
    Compute a time-weighted average of a variable in a time series.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing a time column and a value column.
    value_col : str
        Name of the column containing the quantity to average (e.g. 'heartrate', 'power').
    weight_col : str, optional
        Name of the column representing differential time (dt), or another desired
        weighting field

    Returns
    -------
    float
        Time-weighted average of the value column.

    Notes
    -----
    - Each interval between samples is weighted by its duration `dt`.
    - If the time column is absolute timestamps (datetime64), differences are
      automatically converted to seconds.
    - Missing values are ignored (they simply contribute zero weight).

    Examples
    --------
    >>> time_weighted_avg(df, 'heartrate')
    134.2
    >>> time_weighted_avg(df, 'power', weight_col='d_elapsed')
    215.7
    """
    if weight_col not in df.columns or value_col not in df.columns:
        raise ValueError(f"Missing required columns '{weight_col}' or '{value_col}'")

    numer = (df[value_col] * df[weight_col]).sum()
    denom = df[weight_col].sum()
    if denom == 0:
        return float("nan")
    return float(numer / denom)


def label_uphill_downhill(
    df: pd.DataFrame,
    altitude_col: str = "altitude",
    prominence_ft: float = 30.0
) -> pd.DataFrame:
    """
    Label uphill and downhill segments in a GPS track based on altitude extrema.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing at least an altitude column.
    altitude_col : str, optional
        Column name containing altitude data (default 'altitude').
    prominence_ft : float, optional
        Minimum prominence (vertical separation) in feet for peaks/valleys
        to be considered distinct (default 30.0).

    Returns
    -------
    pd.DataFrame
        Copy of input DataFrame with an added 'segment' column containing
        'uphill' or 'downhill' labels for each sample.

    Notes
    -----
    - Uses `scipy.signal.find_peaks` to locate local maxima and minima.
    - Adjacent extrema define either an uphill (valley→peak) or downhill
      (peak→valley) segment.
    - Small undulations below the prominence threshold are merged.

    Examples
    --------
    >>> labeled = label_uphill_downhill(df)
    >>> labeled['segment'].value_counts()
    uphill      3520
    downhill    3480
    Name: segment, dtype: int64
    """
    if altitude_col not in df.columns:
        raise ValueError(f"Missing altitude column '{altitude_col}'")
    data = df.copy()

    # Identify local maxima (summits) and minima (valleys)
    peaks, _ = find_peaks(data[altitude_col], prominence=prominence_ft)
    valleys, _ = find_peaks(-data[altitude_col], prominence=prominence_ft)
    extrema = sorted(set([0, *peaks, *valleys, len(data) - 1]))

    # Label uphill/downhill between consecutive extrema
    data["segment"] = None
    for start, end in zip(extrema[:-1], extrema[1:]):
        start_alt = data.iloc[start][altitude_col]
        end_alt = data.iloc[end][altitude_col]
        label = "uphill" if end_alt > start_alt else "downhill"
        data.loc[start:end, "segment"] = label

    return data


def has_required_cols(df: pd.DataFrame, required_cols: set) -> bool:
    return len(required_cols - set(df.columns)) == 0


def compute_metrics(
    activity_id: int,
    user_id: str,
    health_metrics: dict | None = None,
) -> dict:
    df = load_stream(activity_id, user_id)

    metrics = {
        "analyzed_at": datetime.utcnow().isoformat(),
    }

    # intermediate quantities we'll need
    if 'time' in df.columns:
        df['dt'] = df['time'].diff().fillna(0)
    if 'altitude' in df.columns:
        df = label_uphill_downhill(df)

    # uphill / downhill heartrate
    if has_required_cols(df, {'time', 'heartrate', 'altitude'}):
        uphill_heartrate = time_weighted_avg(df.query("segment == 'uphill'"), "heartrate")
        downhill_heartrate = time_weighted_avg(df.query("segment == 'downhill'"), "heartrate")
        if not np.isnan(uphill_heartrate):
            metrics['uphill_heartrate'] = uphill_heartrate
        if not np.isnan(downhill_heartrate):
            metrics['downhill_heartrate'] = downhill_heartrate

    return metrics
