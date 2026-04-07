Sync the standalone alchemy-v2.html file with the current PWA source.

The original single-file version lives at ~/alchemy-v2.html. The PWA source is in ~/alchemy/.

To sync (PWA is the source of truth):

1. Read current app.css, index.html body, and app.js
2. Reconstruct a single HTML file:
   - `<style>` + contents of app.css + `</style>`
   - Body from index.html (between `<body>` and `</body>`)
   - `<script>` + contents of app.js + `</script>`
3. Remove PWA-specific tags (manifest link, apple-mobile-web-app metas, service worker registration)
4. Add the Google Fonts `@import` back into the `<style>` block if needed
5. Write to ~/alchemy-v2.html
6. Validate JS syntax in the combined file

This is a one-way sync. The PWA version is authoritative.
