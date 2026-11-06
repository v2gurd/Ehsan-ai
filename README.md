# Ehsan AI

A Persian-first AI chat interface with a dark glassmorphism UI.

## Architecture
- `index.html`: GitHub Pages static frontend.
- `supabase/functions/ehsan-ai/index.ts`: Supabase Edge Function proxy.
- Gemini API key is stored only as a Supabase Edge Function secret. Never put it in `index.html`.

## Setup
1. Create a Gemini API key in Google AI Studio.
2. In Supabase project `psvesfkxtmlnjyhphsfs`, open **Edge Functions → Secrets** and add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
3. Function `ehsan-ai` has already been deployed to this project.
4. In the function's CORS allowlist, update the GitHub Pages origin if you use a custom domain. The current function accepts `*.github.io` and localhost:5500.
5. Push `index.html` to the root of a GitHub repository.
6. In GitHub: Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

## Local preview
Open `index.html` with VS Code Live Server on `http://localhost:5500`.

## Notes
- The browser contains only the Supabase publishable key, which is designed for public clients.
- The Gemini key must remain in Supabase secrets.
- The first version includes live AI chat and responsive UI. Persistent account-based chat history, auth, image generation and voice are later milestones.
