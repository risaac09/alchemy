Add a new reflection prompt to Alchemy.

The user will provide the prompt text and optionally which pool it belongs to.

Prompt pools in app.js `promptPools` object:
- `link` — for URLs/articles. Tone: "why did you stop scrolling?"
- `image` — for images. Tone: "what's outside the frame?"
- `document` — for files/PDFs. Tone: "what's the one thing you didn't know?"
- `text` — for raw thoughts. Tone: general reflection, embodied
- `resurfaced` — for items returning from archive. Tone: "is this still worth carrying?"

Rules:
- Prompts are questions, not instructions
- Direct and personal — use "you", not "one"
- Philosophically loaded but never academic
- Under 80 characters if possible
- Must not duplicate an existing prompt (check all pools first)

Add the prompt to the appropriate array in `promptPools`, validate JS syntax, done.
