from pathlib import Path
import re
import shutil

ROOT = Path(".")
ANDROID = ROOT / "android"
NATIVE = ROOT / "PriceWatchNative"

if ANDROID.exists():
    shutil.rmtree(ANDROID)
if NATIVE.exists():
    shutil.rmtree(NATIVE)

print("Generating clean React Native 0.81.5 Android shell...")
