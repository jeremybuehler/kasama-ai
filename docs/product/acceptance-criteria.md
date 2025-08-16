# Acceptance Criteria — Kasama.ai Phase 1 MVP

Document status: Draft v1.0
Owner: Product
Reviewers: Engineering, Design, Data, Safety, QA
Last updated: {{date}}

The MVP is considered acceptable for private beta when all criteria below are met.

1. Authentication

- Users can sign up and sign in via email magic link and Google OAuth.
- Sessions persist across refresh with secure token storage; logout works.
- Email verification and abuse throttling in place.

2. Onboarding and Profile

- Multi-step onboarding collects: name, age, pronouns, city, 3–6 photos, short bio, intentions, top 5 values, optional lifestyle flags, optional dealbreakers.
- Progress save-and-resume works; validation and error states are clear.
- AI profile assistant provides at least 3 bio suggestions and photo guidance; user can accept/edit/decline.
- Profile completion meter reflects required items; completion ≥ 70% for new users in smoke tests.

3. Matching

- Deterministic baseline scoring implemented with documented weights and hard filters.
- Daily match batch delivered (configurable N) and refreshes every 24 hours.
- Optional LLM re-rank can be toggled via feature flag; graceful fallback on failure.
- “Why this match” explanation present for each card using structured factors.

4. Profile Cards and Decisions

- Users can view card details (photos, bio, values highlights) and make a binary decision (Yes/Pass).
- Limited rewind for premium users (1/day) works and respects decision logs.
- Empty-state and end-of-batch states are implemented.

5. Chat

- Chat unlocks only on mutual Yes; non-matches cannot message.
- Text-only messaging works with basic delivery and unread indicators.
- Conversation prompts display on first open and on long inactivity.
- Server-side moderation filters prevent sending/receiving disallowed content; clear user feedback on blocks.

6. Notifications and Email

- Web push: new matches available, mutual like, new message; opt-in flow complies with browser requirements.
- Emails: magic link, welcome, onboarding nudge, re-engagement, payment receipts.
- Users can toggle categories and set quiet hours; rate limits applied.

7. Safety and Reporting

- Users can block and report; reports are categorized and timestamped.
- Image uploads are scanned; EXIF data is stripped.
- Basic admin triage view lists reports with status changes and notes.

8. Payments and Subscription

- Users can start, cancel, and resume a subscription via Stripe checkout/portal.
- Premium entitlements are enforced in-app (extra matches, boost, rewind, read receipts).
- Receipts are emailed; billing events are idempotently processed via webhooks.

9. Analytics and Observability

- Event schema implemented for core funnel events (as defined in spec) with user IDs and timestamps.
- Dashboards for activation, D1/D7 retention, match-to-message rate; alerting for critical failures.
- Error tracking captures client and server exceptions with PII scrubbing.

10. Performance and Reliability

- PWA LCP < 2.5s on target device/network for onboarding, matches, and chat screens.
- API P95 latency < 300ms (non-AI) and < 1.5s (AI endpoints) in staging load tests.
- Uptime SLO 99.5% (synthetic checks) over a 7-day stabilization window.

11. Accessibility and Compatibility

- Keyboard navigable; ARIA landmarks; sufficient contrast; images have alt text.
- Works on latest Chrome, Safari, Firefox, and Edge (desktop and mobile browsers) with responsive layouts.

12. Privacy and Security

- Transport security (TLS) enforced; secure cookies and CSRF protections in place.
- Access controls on admin tools; audit logs for moderation and data access.
- No photos or raw PII sent to LLM provider; prompts are redacted.

13. Beta Readiness Checklist

- Incident response runbook and on-call rotation defined.
- Support macros and help center articles drafted.
- Feature flags configured for risky modules (LLM re-rank, boosts, read receipts).
- Cohort tracking configured for the success checkpoint.
