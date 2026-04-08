# Alchemy iOS

WKWebView wrapper — bundles the PWA for App Store distribution.

## Setup (one time)

```bash
# 1. Install Xcode from the Mac App Store (~15GB)

# 2. Install xcodegen
brew install xcodegen

# 3. Generate the .xcodeproj
cd ios/
xcodegen generate

# 4. Open in Xcode
open Alchemy.xcodeproj
```

## In Xcode

1. Select the **Alchemy** target → **Signing & Capabilities**
2. Set your Team (requires Apple Developer account, $99/yr)
3. Bundle ID is already set: `com.rubinsteinproductions.alchemy`
4. Run on simulator → looks correct → Archive → Distribute to App Store

## Architecture

```
ios/
  Alchemy/
    AppDelegate.swift      — app entry point
    ViewController.swift   — WKWebView wrapper, loads Web/index.html
    Info.plist             — bundle metadata, portrait only, light status bar
    Assets.xcassets/       — all iOS icon sizes (generated from icon-512.png)
  project.yml              — xcodegen spec (generates .xcodeproj)
```

The web files (index.html, app.js, app.css, etc.) are copied into a `Web/`
subfolder inside the app bundle at build time. `localStorage` and all state
persist between launches via WKWebView's default data store.

External links open in Safari. Service worker is not registered in the native
app (file:// origin limitation) — state is all localStorage anyway, works fine.

## Updating

When you push changes to the PWA, the iOS app picks them up automatically
at the next Xcode build (the build script copies fresh web files each time).
No separate deployment step needed.

## App Store notes

- Privacy: no tracking, no network requests, no accounts — Privacy Nutrition
  Label is empty. Easy review.
- Category: Productivity
- Keywords: information metabolism, notes, capture, reflect, second brain
- The "slowness is the point" framing distinguishes it from generic note apps.
