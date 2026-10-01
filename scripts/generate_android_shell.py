from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(".")
ANDROID = ROOT / "android"
NATIVE = ROOT / "PriceWatchNative"

if ANDROID.exists():
    shutil.rmtree(ANDROID)
if NATIVE.exists():
    shutil.rmtree(NATIVE)

subprocess.run(
    [
        "npx",
        "@react-native-community/cli@20.0.1",
        "init",
        "PriceWatchNative",
        "--version",
        "0.81.5",
        "--skip-install",
    ],
    check=True,
)

for name in ["src", "App.tsx", "App.js", "index.js"]:
    p = NATIVE / name
    if p.is_dir():
        shutil.rmtree(p)
    elif p.exists():
        p.unlink()

shutil.copytree(ROOT / "src", NATIVE / "src")
for name in ["App.js", "index.js", "babel.config.js", "metro.config.js", "app.json"]:
    shutil.copy2(ROOT / name, NATIVE / name)

shutil.copytree(NATIVE / "android", ANDROID)

for p in (ANDROID / "app" / "src" / "main").rglob("*"):
    if p.is_file():
        text = p.read_text(errors="ignore")
        text = text.replace("PriceWatchNative", "PriceWatch")
        text = text.replace("com.pricewatchnative", "com.pricewatch.app")
        text = text.replace("com.nativeshell", "com.pricewatch.app")
        p.write_text(text)

build_gradle = ANDROID / "app" / "build.gradle"
s = build_gradle.read_text()
if "buildFeatures {" not in s:
    s = s.replace(
        "android {",
        "android {\n    buildFeatures {\n        buildConfig true\n    }",
        1,
    )
elif "buildConfig true" not in s:
    s = s.replace("buildFeatures {", "buildFeatures {\n        buildConfig true", 1)

s = s.replace('namespace "com.pricewatchnative"', 'namespace "com.pricewatch.app"')
s = s.replace("namespace 'com.pricewatchnative'", "namespace 'com.pricewatch.app'")
s = s.replace('applicationId "com.pricewatchnative"', 'applicationId "com.pricewatch.app"')
s = s.replace("applicationId 'com.pricewatchnative'", "applicationId 'com.pricewatch.app'")
build_gradle.write_text(s)

gradle_props = ANDROID / "gradle.properties"
gp = gradle_props.read_text() if gradle_props.exists() else ""
for key in ("newArchEnabled", "bridgelessEnabled"):
    if re.search(rf"^{key}=.*$", gp, flags=re.MULTILINE):
        gp = re.sub(rf"^{key}=.*$", f"{key}=false", gp, flags=re.MULTILINE)
    else:
        gp += f"\n{key}=false\n"
gradle_props.write_text(gp)

for p in (ANDROID / "app" / "src" / "main" / "res").rglob("strings.xml"):
    text = p.read_text()
    text = re.sub(
        r'<string name="app_name">.*?</string>',
        '<string name="app_name">Price Watch</string>',
        text,
    )
    p.write_text(text)

res = ANDROID / "app" / "src" / "main" / "res"
for p in res.rglob("ic_launcher*"):
    if p.is_file():
        p.unlink()

from PIL import Image, ImageDraw

sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for density, size in sizes.items():
    folder = res / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGBA", (size, size), (18, 20, 23, 255))
    draw = ImageDraw.Draw(image)
    scale = size / 108.0
    draw.ellipse(
        (18 * scale, 18 * scale, 78 * scale, 78 * scale),
        outline=(245, 190, 40, 255),
        width=max(2, int(8 * scale)),
    )
    draw.line(
        (72 * scale, 72 * scale, 92 * scale, 92 * scale),
        fill=(245, 190, 40, 255),
        width=max(2, int(9 * scale)),
    )
    image.save(folder / "ic_launcher.png")

(res / "mipmap-anydpi-v26").mkdir(parents=True, exist_ok=True)
(res / "values").mkdir(parents=True, exist_ok=True)
(res / "drawable").mkdir(parents=True, exist_ok=True)

(res / "mipmap-anydpi-v26" / "ic_launcher.xml").write_text(
    '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/price_watch_icon_background"/>
    <foreground android:drawable="@drawable/ic_price_watch_foreground"/>
</adaptive-icon>
'''
)

(res / "values" / "price_watch_colors.xml").write_text(
    '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="price_watch_icon_background">#121417</color>
</resources>
'''
)

(res / "drawable" / "ic_price_watch_foreground.xml").write_text(
    '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#F5BE28"
        android:pathData="M54,18a30,30 0,1 0,0 60a30,30 0,1 0,0 -60M54,28a20,20 0,1 1,0 40a20,20 0,1 1,0 -40M72,72l18,18l-7,7l-18,-18z"/>
</vector>
'''
)

manifest = ANDROID / "app" / "src" / "main" / "AndroidManifest.xml"
text = manifest.read_text()
text = re.sub(r'android:icon="[^"]+"', 'android:icon="@mipmap/ic_launcher"', text, count=1)
text = re.sub(r'android:roundIcon="[^"]+"', 'android:roundIcon="@mipmap/ic_launcher"', text, count=1)
text = re.sub(r'android:name="\\.MainApplication"', 'android:name="com.pricewatch.app.MainApplication"', text)
text = re.sub(r'android:name="\\.MainActivity"', 'android:name="com.pricewatch.app.MainActivity"', text)
manifest.write_text(text)

java_root = ANDROID / "app" / "src" / "main" / "java"
old_pkg = java_root / "com" / "pricewatchnative"
new_pkg = java_root / "com" / "pricewatch" / "app"
if old_pkg.exists():
    new_pkg.parent.mkdir(parents=True, exist_ok=True)
    if new_pkg.exists():
        shutil.rmtree(new_pkg)
    shutil.move(str(old_pkg), str(new_pkg))

main_apps = list(java_root.rglob("MainApplication.kt"))
if not main_apps:
    raise RuntimeError("MainApplication.kt not found")
main_app = main_apps[0]

main_activity = new_pkg / "MainActivity.kt"
main_activity.write_text(
    '''package com.pricewatch.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "PriceWatch"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, false)
}
'''
)

main_app.write_text(
    '''package com.pricewatch.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages() = PackageList(this).packages
            override fun getJSMainModuleName() = "index"
            override fun getUseDeveloperSupport() = BuildConfig.DEBUG
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override fun onCreate() {
        super.onCreate()
        loadReactNative(this)
    }
}
'''
)

print(f"Android shell generated: {ANDROID}")
print(f"Native diagnostics installed: {main_app}")
