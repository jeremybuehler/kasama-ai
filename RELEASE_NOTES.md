# Release Notes: Security Guardrails, Optional Jest Runner, and Contributor Guide

Date: 2025-09-07
PR: https://github.com/jeremybuehler/kasama-ai/pull/2

## Highlights
- Security: Added pre-commit secret scanning (ripgrep-based) and Gitleaks to the Security workflow. This reduces risk of leaked credentials and improves repo hygiene.
- Testing: Enabled an optional Jest runner (ts-jest + babel-jest) for teams that prefer Jest in certain scenarios. Vitest remains the primary runner.
- Documentation: Introduced AGENTS.md (Repository Guidelines) with project structure, build/test commands, coding style, and testing thresholds. Includes a brief Architecture Overview.

## Developer Impact
- New scripts:
  - `npm run test:jest` and `npm run test:jest:functional` for optional Jest usage.
- Pre-commit changes:
  - The `.husky/pre-commit` hook now runs `lint-staged` and a secrets scan. Ensure `rg` (ripgrep) is installed locally.
- CI updates:
  - Security workflow now runs TruffleHog and Gitleaks. Badges for CI and Security appear atop README.

## Notes
- No secrets were committed as part of this change. If historical `.env` files contained sensitive values, consider a history rewrite and key rotation.
- Vitest remains the default path for unit/integration tests; Jest is provided for compatibility.
