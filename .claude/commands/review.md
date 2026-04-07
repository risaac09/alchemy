Run a comprehensive review of the Alchemy codebase.

Read CLAUDE.md first for design principles, then audit:

1. **Design principle violations** — any SaaS patterns, gamification, removed friction, external calls
2. **Bugs** — state mutations without save, missing DOM refs, regex issues, quota handling
3. **UX** — touch targets, text sizes, reduced-motion, color contrast, keyboard accessibility
4. **Performance** — unnecessary re-renders, localStorage bloat, backgrounded tab behavior
5. **PWA** — cache version matches, share target params match JS, offline works

Output a prioritized list: Critical > Important > Minor > Design concerns.
