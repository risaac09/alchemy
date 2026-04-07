---
name: deploy
description: Deploy Alchemy to GitHub Pages. Bumps service worker cache, commits, pushes, verifies deployment.
---

You are deploying Alchemy to GitHub Pages.

## Steps

1. **Check for uncommitted changes:**
   ```
   git status
   git diff
   ```

2. **Bump service worker cache version** if any cached assets changed (app.css, app.js, index.html, icons):
   - In `sw.js`, increment the version number in `CACHE_NAME` (e.g., `alchemy-v3` -> `alchemy-v4`)
   - This forces existing PWA installations to re-download the app shell

3. **Validate before committing:**
   ```
   node -e "new Function(require('fs').readFileSync('app.js','utf8'))"
   node -e "require('./manifest.json')"
   ```

4. **Commit and push:**
   - Stage only the changed files (not `git add -A`)
   - Write a concise commit message describing what changed
   - Push to `origin main`

5. **Verify deployment:**
   ```
   gh api repos/risaac09/alchemy/pages
   ```
   - Status should show the deployment is queued or building
   - GitHub Pages typically deploys within 1-2 minutes
   - Live URL: https://risaac09.github.io/alchemy/

6. **Post-deploy check:**
   - The service worker will serve the old cached version to existing users until the new SW activates
   - New visitors get the latest immediately
   - Existing PWA users will get the update on their next visit (SW checks for updates on navigation)
