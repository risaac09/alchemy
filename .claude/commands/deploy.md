Deploy Alchemy to GitHub Pages.

1. Run `git status` and `git diff` to see what changed
2. Validate JS syntax: `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`
3. Validate manifest: `node -e "require('./manifest.json')"`
4. If any cached assets changed (app.css, app.js, index.html), bump `CACHE_NAME` in sw.js
5. For feature additions, bump `VERSION` in app.js (semver: major.minor.patch)
6. Stage the changed files, commit with a descriptive message, push to origin main
6. Check deployment status: `gh api repos/risaac09/alchemy/pages`
7. Report the live URL: https://risaac09.github.io/alchemy/
