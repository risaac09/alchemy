---
name: review
description: Review Alchemy codebase for bugs, UX issues, performance, and design principle violations. Returns a prioritized list.
---

You are reviewing the Alchemy codebase. Read CLAUDE.md first for design principles.

## What to check

### 1. Design principle violations
- Any SaaS patterns creeping in (notification dots, streaks, gamification)
- Convenience features that bypass intentional friction
- Capacity limits being worked around
- External service calls or analytics
- Microcopy that sounds corporate or academic instead of direct/philosophical

### 2. Bugs
- State mutations without `saveState()`
- DOM element IDs referenced in JS but missing from HTML
- Event listeners that could fire on removed elements
- Regex with global flag used in boolean context (`.test()`)
- localStorage quota not handled
- Race conditions in async file processing

### 3. UX issues
- Touch targets too small on mobile (should be >= 44px)
- Text too small to read (body should be >= 16px)
- Animations that don't respect `prefers-reduced-motion`
- Color contrast failures against the dark background
- Textarea not auto-resizing on content
- Modal not trapping focus for keyboard users

### 4. Performance
- `renderInbox()` recreates all DOM nodes on every tick (5s) — should diff or only re-render changed items
- Image thumbnails stored as data URLs in localStorage — large thumbnails can fill quota
- `setInterval(tick, 5000)` runs even when tab is backgrounded — consider `requestAnimationFrame` or `document.visibilityState` check

### 5. PWA
- Service worker cache version matches deployed assets
- Manifest share_target params match what `checkCaptureParam()` expects
- Offline mode works (all assets cached, fonts cached separately)
- iOS: `apple-mobile-web-app-capable` and `apple-touch-icon` present

## Output format

Return a prioritized list:
```
## Critical (breaks functionality)
- ...

## Important (degrades experience)
- ...

## Minor (polish)
- ...

## Design principle concerns
- ...
```
