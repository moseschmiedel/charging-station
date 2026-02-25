#!/usr/bin/env python3
"""Visualize beacon tracking CSV recordings."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Plot recorded beacon tracking CSV data")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/test1.csv"),
        help="Path to input CSV file",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("plots/test1_overview.png"),
        help="Path to output image file",
    )
    parser.add_argument(
        "--show",
        action="store_true",
        help="Display the plot window in addition to saving the file",
    )
    return parser.parse_args()


def validate_columns(df: pd.DataFrame) -> None:
    required = [
        "t_ms",
        "raw_f",
        "raw_b",
        "raw_l",
        "raw_r",
        "A_F",
        "A_B",
        "A_L",
        "A_R",
        "theta_deg",
        "S",
        "detected",
    ]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")


def main() -> None:
    args = parse_args()
    if not args.input.exists():
        raise FileNotFoundError(f"Input CSV not found: {args.input}")

    df = pd.read_csv(args.input)
    validate_columns(df)

    time_s = (df["t_ms"] - df["t_ms"].iloc[0]) / 1000.0
    detected_mask = df["detected"].astype(bool)

    fig, axes = plt.subplots(4, 1, figsize=(14, 12), sharex=True)
    fig.suptitle(f"Beacon tracking visualization: {args.input.name}", fontsize=14)

    axes[0].plot(time_s, df["raw_f"], label="raw_f")
    axes[0].plot(time_s, df["raw_b"], label="raw_b")
    axes[0].plot(time_s, df["raw_l"], label="raw_l")
    axes[0].plot(time_s, df["raw_r"], label="raw_r")
    axes[0].set_ylabel("Raw ADC")
    axes[0].set_title("Raw sensor channels")
    axes[0].grid(alpha=0.3)
    axes[0].legend(ncol=4, fontsize=9)

    axes[1].plot(time_s, df["A_F"], label="A_F")
    axes[1].plot(time_s, df["A_B"], label="A_B")
    axes[1].plot(time_s, df["A_L"], label="A_L")
    axes[1].plot(time_s, df["A_R"], label="A_R")
    axes[1].set_ylabel("Amplitude")
    axes[1].set_title("Calibrated amplitudes")
    axes[1].grid(alpha=0.3)
    axes[1].legend(ncol=4, fontsize=9)

    axes[2].plot(time_s, df["theta_deg"], color="tab:purple", label="theta_deg")
    axes[2].axhline(0.0, color="black", linewidth=1, alpha=0.5)
    axes[2].scatter(
        time_s[~detected_mask],
        df.loc[~detected_mask, "theta_deg"],
        color="tab:red",
        s=10,
        label="not detected",
        alpha=0.7,
    )
    axes[2].set_ylabel("Angle [deg]")
    axes[2].set_title("Estimated bearing")
    axes[2].grid(alpha=0.3)
    axes[2].legend(fontsize=9)

    axes[3].plot(time_s, df["S"], color="tab:green", label="S")
    axes[3].fill_between(
        time_s,
        0,
        df["S"],
        where=detected_mask,
        color="tab:green",
        alpha=0.2,
        label="detected",
    )
    axes[3].set_ylabel("Signal sum")
    axes[3].set_xlabel("Time [s]")
    axes[3].set_title("Total signal and detection state")
    axes[3].grid(alpha=0.3)
    axes[3].legend(fontsize=9)

    fig.tight_layout(rect=[0, 0, 1, 0.97])

    args.output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.output, dpi=160)
    print(f"Saved plot: {args.output}")

    if args.show:
        plt.show()


if __name__ == "__main__":
    main()
