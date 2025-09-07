# Repository Guidelines

## Project Structure & Modules
- Source: `src/` (React + TypeScript). Key areas: `components/`, `pages/`, `lib/`, `services/`, `hooks/`, `utils/`, `styles/`.
- Tests: Unit setup in `src/test/` and specs alongside code or under `src/__tests__/`.
- E2E/functional: `tests/functional/` (Playwright).
- Server utilities: `server/` (controllers, middleware, services).
- Static assets: `public/`. Builds output to `dist/`. Supporting scripts in `scripts/`. Docs in `docs/`.

## Architecture Overview
- Client-first SPA built with React + Vite; routing via `react-router-dom`.
- Data/access via `src/services/` (includes `services/ai/` for agent logic) and `src/lib/` helpers.
- State: `@tanstack/react-query` for server state; `zustand`/Redux for local or cross-cutting app state.
- Styling: TailwindCSS utilities with project tokens; minimal global CSS in `src/styles/`.

## Build, Test, and Development
- Start dev server: `npm run dev` (Vite, hot reload).
- Type check: `npm run typecheck`.
- Lint & format: `npm run lint` and `npm run format`.
- Build: `npm run build` (validates env, then Vite build). Preview: `npm run preview`.
- Unit tests (Vitest): `npm run test` (watch UI: `npm run test:ui`, coverage: `npm run test:coverage`).
- E2E (Playwright): `npm run test:e2e` (UI: `npm run test:e2e:ui`, headed: `npm run test:e2e:headed`).
- Full validation before launch: `npm run launch:full-validation`.

## Coding Style & Naming
- Formatting: Prettier (2‑space indent). Linting: ESLint (TypeScript, React). Pre-commit: Husky + lint-staged runs Prettier and ESLint.
- React components: `PascalCase` files (e.g., `UserCard.tsx`). Hooks: `useThing.ts`. Utilities/services: `camelCase.ts`.
- Test files: `*.test.ts(x)` or `*.spec.ts(x)` colocated or in `src/__tests__/`.
- CSS: TailwindCSS; shared styles in `src/styles/`. Prefer utility classes; co-locate component styles when needed.

## Testing Guidelines
- Framework: Vitest (jsdom). Coverage thresholds (from `vitest.config.ts`): statements 80%, lines 80%, functions 80%, branches 75%.
- Write fast, deterministic unit tests; mock network with `msw`/stubs where appropriate.
- E2E: Put scenarios under `tests/functional/`; tag performance runs with `@performance` and run via `npm run test:performance`.
- Critical paths: aim ≥85–90% in `src/lib/` and `src/services/ai/`.
- Jest: Legacy-only. `jest.config.js` retained for reference with thresholds aligned to Vitest. Prefer Vitest for TS support.

## Commit & Pull Requests
- Commit messages: Prefer Conventional Commits with optional emoji (e.g., `feat: add report export`, `fix: resolve build error`).
- PRs: Include purpose, key changes, linked issues, screenshots for UI, and testing notes. Ensure CI passes: typecheck, lint, unit, and E2E (where applicable).

## Security & Configuration
- Env files: copy `.env.example` to `.env` (see `.env.cloudflare.example` for CF). Never commit secrets.
- Validate env before building with `npm run build` or `node scripts/validate-env.js`.
- Review `DEPLOYMENT_GUIDE.md` and `VERCEL_MCP_INTEGRATION.md` for hosting specifics.
