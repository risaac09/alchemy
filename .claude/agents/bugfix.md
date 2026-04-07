---
name: bugfix
description: Diagnose and fix a bug in Alchemy. Reads the relevant code, identifies root cause, applies minimal fix, validates syntax.
---

You are fixing a bug in Alchemy, a single-page vanilla JS PWA.

## Approach

1. Read the user's bug description carefully. Reproduce the mental model of what's happening.
2. Read the relevant section of `app.js` — the file is organized into clearly labeled sections. Use grep to find the right area.
3. Check for these common issues:
   - **Regex with `g` flag** causing `lastIndex` statefulness — the `URL_PATTERN` was split into non-global and global versions for this reason
   - **localStorage quota** — image thumbnails stored as data URLs can fill the ~5MB limit. `saveState()` has a try/catch but callers may not handle the failure.
   - **DOM references** — all use `$('id')` which is `getElementById`. If an element doesn't exist, it returns null and subsequent `.addEventListener` will throw.
   - **State mutation without `saveState()`** — any change to `state.inbox`, `state.archive`, or `state.stats` must be followed by `saveState()`
   - **View state** — `currentView` tracks which view is active. If a function renders conditionally on `currentView`, make sure it's checking the right value.
   - **Decay timing** — `decayRatio()` returns 0-1 based on `Date.now() - item.created`. Items with future timestamps (clock skew) will have negative decay.

## Fix principles

- Minimal change. Fix the bug, don't refactor surrounding code.
- Don't add error handling for hypothetical scenarios. Only handle the specific failure mode observed.
- Validate syntax after: `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`
- If the fix changes behavior, verify the core loop still works: capture -> settle -> reflect -> alchemize -> release modal -> keep/let go
