Roll back the last deployment of Alchemy.

Steps:

1. Run `git log --oneline -5` in ~/alchemy/ to show recent commits
2. Ask which commit to revert to (default: previous commit)
3. Run `git revert HEAD --no-edit` (or the specified range)
4. Bump the service worker cache version in sw.js (e.g., alchemy-v4 → alchemy-v5)
5. Commit the revert + cache bump together
6. Push to main (GitHub Pages auto-deploys)
7. Verify the site is live: `curl -s https://risaac09.github.io/alchemy/sw.js | head -1`

If the revert has conflicts, stop and show them to the user rather than force-resolving.
