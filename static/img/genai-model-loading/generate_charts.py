#!/usr/bin/env python3
"""Generate comparison charts for the benchmark blog post."""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

OUT = os.path.dirname(os.path.abspath(__file__))

# Data
strategies = [
    "S3 + s5cmd\nInit Container",
    "S3 + Run:ai\nModel Streamer",
    "FSx Lustre\n+ Run:ai Streamer",
    "ECR Container\nImage",
    "EFS\n(Elastic)",
    "EBS Snapshot\n+ Run:ai Streamer",
    "HuggingFace\nDirect",
    "Mountpoint\nfor Amazon S3",
    "FSx for\nLustre",
]

# Times in seconds
cold_start = [331, 508, 570, 641, 650, 660, 1173, 1658, 1954]
weight_loading = [92, 373, 398, 67, 482, 463, 1080, 1347, 1767]
other_time = [cs - wl for cs, wl in zip(cold_start, weight_loading)]


def comparison_bar_chart():
    fig, ax = plt.subplots(figsize=(14, 7))

    y = np.arange(len(strategies))
    height = 0.6

    # Stacked horizontal bars
    bars_other = ax.barh(y, other_time, height, label="Image Pull + Init + KV Cache", color="#FF9900", edgecolor="white", linewidth=0.5)
    bars_weight = ax.barh(y, weight_loading, height, left=other_time, label="Weight Loading", color="#232F3E", edgecolor="white", linewidth=0.5)

    ax.set_yticks(y)
    ax.set_yticklabels(strategies, fontsize=12, fontfamily="Helvetica")
    ax.invert_yaxis()
    ax.set_xlabel("Cold-Start Time (seconds)", fontsize=13, fontfamily="Helvetica")
    ax.set_title("Cold-Start Time Comparison: LLM Model Loading Strategies on Amazon EKS",
                 fontsize=14, fontfamily="Helvetica", fontweight="bold", pad=15)

    # Add time labels on bars
    for i, (cs, wl, ot) in enumerate(zip(cold_start, weight_loading, other_time)):
        minutes = cs // 60
        secs = cs % 60
        ax.text(cs + 15, i, f"{minutes}m {secs}s", va="center", fontsize=11,
                fontweight="bold", fontfamily="Helvetica", color="#232F3E")

    ax.legend(loc="upper right", fontsize=11, framealpha=0.9)
    ax.set_xlim(0, max(cold_start) * 1.18)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="x", alpha=0.3, linestyle="--")

    plt.tight_layout()
    plt.savefig(os.path.join(OUT, "comparison-chart.png"), dpi=150, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close()


def cold_start_timeline():
    """Timeline diagram showing the four phases of a cold start."""
    fig, ax = plt.subplots(figsize=(16, 5))

    phases = [
        ("Node\nProvisioning", 120, "#146EB4"),
        ("Container\nImage Pull", 60, "#FF9900"),
        ("Model Weight\nLoading", 1767, "#CC3333"),
        ("KV Cache\nInit", 13, "#339933"),
    ]

    # Use log-adjusted widths so small phases are still visible
    min_width = 0.8
    total = sum(p[1] for p in phases)
    widths = []
    for _, duration, _ in phases:
        raw = (duration / total) * 10
        widths.append(max(raw, min_width))

    x = 0
    for (label, duration, color), width in zip(phases, widths):
        rect = mpatches.FancyBboxPatch((x, 0.2), width, 0.6, boxstyle="round,pad=0.02",
                                        facecolor=color, edgecolor="white", linewidth=2, alpha=0.85)
        ax.add_patch(rect)
        pct = duration / total * 100
        minutes = duration // 60
        secs = duration % 60
        time_str = f"{minutes}m {secs}s" if minutes > 0 else f"{secs}s"
        ax.text(x + width / 2, 0.5, f"{label}\n({time_str})", ha="center", va="center",
                fontsize=10, fontfamily="Helvetica", fontweight="bold", color="white")
        ax.text(x + width / 2, 0.08, f"{pct:.0f}% of cold start", ha="center", va="center",
                fontsize=9, fontfamily="Helvetica", color="#666666")
        x += width

    ax.set_xlim(-0.3, x + 0.5)
    ax.set_ylim(-0.15, 1.15)
    ax.set_title("Cold-Start Timeline: Where Does the Time Go?\n(worst case — FSx for Lustre, 32 min 34 sec total)",
                 fontsize=14, fontfamily="Helvetica", fontweight="bold", pad=12)
    ax.axis("off")

    # Arrow underneath
    ax.annotate("", xy=(x, -0.05), xytext=(0, -0.05),
                arrowprops=dict(arrowstyle="->", color="#232F3E", lw=2))
    ax.text(x / 2, -0.08, "Time", ha="center", va="top", fontsize=10,
            fontfamily="Helvetica", color="#232F3E")

    plt.tight_layout()
    plt.savefig(os.path.join(OUT, "cold-start-timeline.png"), dpi=150, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close()


if __name__ == "__main__":
    print("Generating charts...")
    comparison_bar_chart()
    print("  - comparison-chart.png")
    cold_start_timeline()
    print("  - cold-start-timeline.png")
    print("Done! Charts saved to:", OUT)
