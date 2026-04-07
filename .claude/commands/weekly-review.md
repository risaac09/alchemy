Run a weekly review of Alchemy's health and usage.

This command is designed to be run manually or scheduled (e.g., via cron or a loop).

Steps:

1. Read CLAUDE.md for current design principles
2. Run `/review` to audit the codebase
3. Check `git log --since="1 week ago" --oneline` for recent changes
4. Open the app in context: read app.js and check for:
   - State shape drift (new fields without migration in loadState)
   - Service worker cache version matches what's deployed
   - Any TODO or FIXME comments
5. Summarize findings as a GitHub issue:
   ```
   gh issue create --repo risaac09/alchemy \
     --title "Weekly review — $(date +%Y-%m-%d)" \
     --body "$(cat <<'EOF'
   ## Review summary
   [findings here]

   ## Action items
   - [ ] ...
   EOF
   )"
   ```
6. If no issues found, skip the GitHub issue and just report "All clear"
