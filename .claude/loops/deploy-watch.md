---
name: deploy-watch
description: Watch for uncommitted changes and remind to deploy. Run with /loop 10m deploy-watch
---

Check if there are uncommitted changes in the alchemy repo:

```
cd /Users/isaacrubinstein/alchemy && git status --porcelain
```

If there are changes:
1. Show which files changed
2. Run the JS syntax check: `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`
3. If syntax is valid, remind: "Uncommitted changes detected in Alchemy. Run `/deploy` when ready."
4. If syntax is broken, warn: "BROKEN: app.js has syntax errors. Fix before deploying."

If no changes, output nothing (stay silent when healthy).
