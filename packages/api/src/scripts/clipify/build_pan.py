#!/usr/bin/env python3
"""Build ffmpeg crop x-expression with hard cuts for face-pan.

Usage: build_pan.py segments.json LEFT_X RIGHT_X
Output: ffmpeg-compatible x expression string.
"""
import json, sys

segs = json.load(open(sys.argv[1]))
left_x = int(sys.argv[2])
right_x = int(sys.argv[3])

# Build hard-cut expression: if between left segment start/end, use left_x; else right_x
parts = []
for s in segs:
    if s["speaker"] == "left":
        parts.append(f"between(t,{s['start']:.3f},{s['end']:.3f})")

if not parts:
    print(str(right_x))
    sys.exit(0)

expr_parts = " + ".join([f"{left_x}*({p})" for p in parts])
# Default to right_x when no left segment active
expr = f"{right_x} + ({left_x} - {right_x})*({'+'.join(parts)})"
print(expr)