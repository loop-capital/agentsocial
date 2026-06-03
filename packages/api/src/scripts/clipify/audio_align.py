#!/usr/bin/env python3
"""Find offset of a sub-clip in a longer source using FFT cross-correlation.

Usage: audio_align.py source.wav subclip.wav
Output: offset in seconds (float)
"""
import numpy as np, sys, struct, wave

def read_wav(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        data = w.readframes(n)
        rate = w.getframerate()
        channels = w.getnchannels()
        samples = np.frombuffer(data, dtype=np.int16).astype(np.float64)
        if channels > 1:
            samples = samples[::channels]  # mono
        return samples, rate

source, sr_s = read_wav(sys.argv[1])
sub, sr_sub = read_wav(sys.argv[2])

assert sr_s == sr_sub, f"Sample rate mismatch: {sr_s} vs {sr_sub}"

# Normalize
source = source / (np.max(np.abs(source)) + 1e-9)
sub = sub / (np.max(np.abs(sub)) + 1e-9)

# FFT cross-correlation
n = len(source) + len(sub) - 1
f_source = np.fft.rfft(source, n)
f_sub = np.fft.rfft(sub, n)
corr = np.fft.irfft(f_source * np.conj(f_sub), n)

offset = int(np.argmax(np.abs(corr)))
if offset > len(source) // 2:
    offset -= n

print(f"{offset / sr_s:.3f}")