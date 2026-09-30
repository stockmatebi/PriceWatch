#!/usr/bin/env python3
import math
import os
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 0.95
OUTPUT = os.path.join("assets", "price_alert.wav")
os.makedirs("assets", exist_ok=True)

# Original "Price Pulse" notification: a short rising digital chime
# composed specifically for Price Watch.
notes = [
    (880.0, 0.00, 0.22),
    (1174.66, 0.16, 0.24),
    (1567.98, 0.33, 0.30),
    (1174.66, 0.55, 0.34),
]

samples = []
total = int(SAMPLE_RATE * DURATION)

for i in range(total):
    t = i / SAMPLE_RATE
    value = 0.0

    for freq, start, length in notes:
        u = t - start
        if 0 <= u < length:
            env = math.exp(-5.0 * u / length) * (1.0 - math.exp(-80.0 * u))
            value += (
                math.sin(2 * math.pi * freq * u)
                + 0.28 * math.sin(2 * math.pi * 2 * freq * u)
                + 0.10 * math.sin(2 * math.pi * 3 * freq * u)
            ) * env

    if 0 <= t < 0.045:
        value += math.exp(-90.0 * t) * 0.16 * math.sin(2 * math.pi * 1800.0 * t)

    value = math.tanh(value * 0.75)
    samples.append(int(max(-1.0, min(1.0, value)) * 32767))

with wave.open(OUTPUT, "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    wav.writeframes(b"".join(struct.pack("<h", s) for s in samples))

print(f"Generated {OUTPUT}")
