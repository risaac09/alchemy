---
name: health-check
description: Periodic health check for the Alchemy PWA. Run with /loop 30m health-check
---

Run these checks and report only failures:

1. **JS syntax valid:**
   ```
   node -e "new Function(require('fs').readFileSync('app.js','utf8'))"
   ```

2. **Manifest valid:**
   ```
   node -e "const m = require('./manifest.json'); if (!m.share_target || !m.icons?.length) throw 'bad manifest'"
   ```

3. **All assets exist:** Check that `index.html`, `app.css`, `app.js`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png` all exist.

4. **Service worker caches correct files:** Read `sw.js`, verify the `ASSETS` array matches the actual files in the directory.

5. **No console errors in JS:** Check for obvious issues like undefined variables, missing function calls.

6. **Git status clean:** No uncommitted changes that should have been deployed.

If everything passes, output: `Alchemy health check passed.`
If anything fails, output the specific failure with suggested fix.
