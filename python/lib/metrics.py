from __future__ import annotations

from datetime import datetime
from .io import load_stream

import pandas as pd
import numpy as np
from scipy.signal import find_peaks


def time_weighted_avg(
    df: pd.DataFrame,
    value_col: str,
    time_col: str = "time"
) -> float:
    """
    Compute a time-weighted average of a variable in a time series.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing a time column and a value column.
    value_col : str
        Name of the column containing the quantity to average (e.g. 'heartrate', 'power').
    time_col : str, optional
        Name of the column representing elapsed time in seconds (default 'time').
        May be absolute timestamps or cumulative seconds.

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
    >>> time_weighted_avg(df, 'power', time_col='elapsed')
    215.7
    """
    if time_col not in df.columns or value_col not in df.columns:
        raise ValueError(f"Missing required columns '{time_col}' or '{value_col}'")

    dt = df[time_col].diff()
    if np.issubdtype(df[time_col].dtype, np.datetime64):
        dt = dt.dt.total_seconds()
    dt = dt.fillna(0)

    values = df[value_col].astype(float)
    mask = values.notna()
    numer = (dt[mask] * values[mask]).sum()
    denom = dt[mask].sum()

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


def compute_metrics(activity_id: int, user_id: str) -> dict:
    df = load_stream(activity_id, user_id)
    # do stuff here
    return {
        "analyzed_at": datetime.utcnow().isoformat(),
    }
