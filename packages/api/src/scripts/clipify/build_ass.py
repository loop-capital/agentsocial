#!/usr/bin/env python3
"""Build opus/karaoke/minimal ASS captions from whisper JSON.

Usage: build_ass.py whisper_output.json output.ass [opus|karaoke|minimal]
"""
import json, sys, os

def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h:01d}:{m:02d}:{s:02d}.{cs:02d}"

def build_ass(segments, style="opus"):
    header = """[Script Info]
Title: Clipify Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
"""

    if style == "opus":
        header += "Style: Default,Arial Black,72,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,4,2,2,30,30,60,1\n"
    elif style == "karaoke":
        header += "Style: Default,Arial,60,&H00FFFFFF,&H0000FF00,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,1,2,30,30,60,1\n"
    else:  # minimal
        header += "Style: Default,Helvetica,56,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,30,30,60,1\n"

    header += "\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"

    events = []
    for seg in segments:
        start = format_time(seg["start"])
        end = format_time(seg["end"])
        text = seg["text"].strip()
        if not text:
            continue

        if style == "opus" and seg.get("words"):
            # Word-by-word with yellow highlight
            word_events = []
            for w in seg["words"]:
                ws = format_time(w["start"])
                we = format_time(w["end"])
                # Current word yellow, rest white
                word_events.append(f"Dialogue: 0,{ws},{we},Default,,0,0,0,,{{\\c&H00FFFF&}}{w['word'].strip()}")
            events.extend(word_events)
        else:
            # Simple segment-based caption
            if style == "karaoke" and seg.get("words"):
                # Group words in chunks of 4
                words = seg["words"]
                chunk_size = 4
                for i in range(0, len(words), chunk_size):
                    chunk = words[i:i+chunk_size]
                    if not chunk:
                        continue
                    cs = format_time(chunk[0]["start"])
                    ce = format_time(chunk[-1]["end"])
                    text = " ".join(w["word"].strip() for w in chunk)
                    events.append(f"Dialogue: 0,{cs},{ce},Default,,0,0,0,,{text}")
            else:
                events.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}")

    return header + "\n".join(events) + "\n"

# Main
whisper_file = sys.argv[1]
output_file = sys.argv[2]
style = sys.argv[3] if len(sys.argv) > 3 else "opus"

with open(whisper_file) as f:
    data = json.load(f)

# Handle whisper JSON format (may be list or dict with segments)
segments = data.get("segments", data) if isinstance(data, dict) else data

ass = build_ass(segments, style)
with open(output_file, "w") as f:
    f.write(ass)

print(f"Wrote {len(segments)} segments to {output_file}", file=sys.stderr)