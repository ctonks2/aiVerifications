# Project Tech Stack — aiVerifications

This document summarizes the main technologies used in the aiVerifications repository.

- **Language:** TypeScript (backend and frontend).
- **Runtime / Node:** Node.js (TS run via `tsx`).
- **Backend server:** Express ([package.json](package.json)).
- **Browser automation:** Playwright (headless browser automation; see `src/ageDetector.ts`).
- **AI integrations:** Anthropic (`@anthropic-ai/sdk`) — Claude client wrapper in `src/claude.ts`.
- **Environment/config:** dotenv for environment variables (`.env`).
- **CORS:** `cors` middleware.
- **Frontend:** React + React DOM (UI is in the `ui/` folder).
- **Frontend tooling:** Vite with `@vitejs/plugin-react` ([ui/vite.config.ts](ui/vite.config.ts)).
- **HTTP client (frontend):** Axios.
- **Type checking / compiler:** TypeScript (`tsc`) with strict settings ([tsconfig.json](tsconfig.json), [ui/tsconfig.json](ui/tsconfig.json)).
- **Dev tooling:** `tsx` to run TypeScript scripts directly, `concurrently` for running multiple processes.

Quick dev commands

```bash
# Run backend API (root)
npm run start

# Run UI dev server (from repo root)
npm run ui

# Run both concurrently
npm run dev:all
```

Key files

- [package.json](package.json)
- [tsconfig.json](tsconfig.json)
- [ui/package.json](ui/package.json)
- [ui/vite.config.ts](ui/vite.config.ts)
- [src/claude.ts](src/claude.ts)
- [src/ageDetector.ts](src/ageDetector.ts)
- [src/config.ts](src/config.ts)

If you want, I can also add this content to README.md or commit it for you. 