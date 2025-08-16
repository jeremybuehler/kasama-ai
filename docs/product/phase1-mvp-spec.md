# Kasama.ai Phase 1 MVP Spec — Intentional Singles

Document status: Draft v1.0
Owner: Product
Reviewers: Engineering, Design, Data, Safety, GTM
Last updated: {{date}}

1. Objectives

- Validate demand for an AI-guided dating experience for intentional singles focused on values, clarity, and meaningful connections.
- Achieve rapid MVP iteration with measurable activation, engagement, and retention.
- Prove willingness to pay for guidance and premium features.

2. Target user and JTBD

- Segment: Singles 24–40 in urban markets who value personal growth, clarity, and intentionality.
- Primary pains: unaligned matches, superficial swiping, anxiety starting conversations, and burnout.
- Jobs-to-be-done:
  - Clarify my dating values and intentions so I can filter for alignment.
  - Create an authentic profile that attracts the right people.
  - Receive a small number of high-quality, values-aligned matches daily.
  - Start and sustain conversations without anxiety.
  - Feel safe and in control.

3. Success criteria (Decision checkpoint)

- Proceed to broader rollout if:
  - Activation to first message: ≥ 35% of new signups in early cohorts.
  - Week 1 retention (D7 return): ≥ 25%.
- Secondary indicators (directional):
  - Profile completion rate ≥ 70%.
  - First like within first session ≥ 60%.
  - Opt-in to notifications ≥ 60%.
  - Conversion to premium trial ≥ 5–10% of active users.

4. In-scope (Phase 1)

- Platform: PWA web app using React + Vite.
- Auth: email magic link + Google OAuth.
- Onboarding: multi-step flow capturing values and intentions.
- AI Assistants:
  - Profile assistant: refine prompts and give photo selection guidance.
  - Matching: deterministic baseline scoring with optional LLM re-rank.
  - Conversation coach: guided prompts for mutual matches.
- Core features:
  - Profile cards, limited daily matches, binary decision (yes/pass).
  - Mutual-like chat (lightweight), unread indicators.
  - Push notifications (web) and transactional emails.
- Trust & Safety: report, block, content moderation for text and images.
- Monetization: basic subscription for premium features.
- Analytics: event tracking and basic dashboards.

5. Out-of-scope (Phase 1)

- Video chat, complex swiping, location-based matching, KYC identity verification, native iOS/Android apps.

6. User flows (happy paths)

- New user onboarding
  1. Landing → Sign up (email or Google)
  2. Verify email/magic link or Google OAuth
  3. Onboarding steps (see section 7)
  4. Profile assistant improvements
  5. First daily batch of matches issued
  6. User makes first like/pass → on mutual like, chat unlocked

- Matching and chat
  1. User receives N daily matches (configurable, e.g., 5)
  2. Opens card → sees values alignment highlights
  3. Choose Yes/Pass; limited rewinds for premium
  4. On mutual Yes, opens chat → receives 1–3 coaching prompts
  5. Sends first message

- Notifications
  - Web push: new matches available, new like, mutual like, unread message.
  - Email: welcome, login link, onboarding nudge, re-engagement, receipts.

7. Onboarding scope (MVP)

- Profile basics: name, age, pronouns, location (city only), photos (3–6), short bio.
- Values & intentions:
  - Relationship intentions (e.g., long-term, open to explore)
  - Top 5 core values (choose from taxonomy; optional free-text add)
  - Lifestyle flags (smoking, drinking, kids, religion—opt-in and skippable)
  - Dealbreakers (bounded list of opt-in topics)
- AI profile assistant:
  - Suggest 3 bio variations based on tone preference.
  - Photo guidance: quality/clarity/variety suggestions (no auto-upload to external services).
  - Safety: never store photos beyond app storage; no facial recognition.

8. Matching system (Phase 1)

- Deterministic baseline score (0–100):
  - Value overlap (weight 40%)
  - Intention alignment (20%)
  - Dealbreaker compatibility (hard filters)
  - Age range fit (10%)
  - Location proximity at city level (10%)
  - Engagement signals (10%) – profile completion, recent activity
  - Diversity penalty to avoid repetitive suggestions (10%)
- Optional LLM re-rank (A/B off by default):
  - Inputs: structured profiles + bio text (no photos)
  - Output: rank adjustment and 1–2 alignment highlights
  - Guardrails: token limits, deterministic fallback on errors/timeouts
- Delivery: issue a daily batch of N matches per user; refill once/24h.

9. Chat (lightweight)

- Mutual like required.
- Features: text only, message read receipts optional (off by default), typing indicator out-of-scope.
- Conversation coach: suggest first-message and follow-ups; tone controls.
- Safety filters: outbound and inbound content moderation before display (see section 12).

10. Premium (basic, MVP)

- Benefits:
  - Extra daily matches (e.g., +5)
  - 1 profile boost/week
  - Rewind last pass (1/day)
  - Read receipts toggle
- Pricing: TBD via experiments; initial anchor $9–$19/month.
- Payments: Stripe checkout + customer portal.

11. Architecture overview

- Client: React + Vite PWA, Service Worker for caching & web push.
- Backend: Node.js/TypeScript API (REST) with auth middleware.
- Persistence: Postgres (primary), Redis (queues/caching), S3-compatible object storage for photos.
- AI:
  - Hosted LLM provider via server-side API for re-rank and copy assist (with strict redaction and rate limits).
  - Local heuristic scoring engine for baseline match score.
- Observability: structured logs, error tracking (Sentry or equivalent), basic metrics.
- Infra:
  - MVP: single region, autoscaling app platform (e.g., Render/Fly/Heroku) or a managed K8s after validation.
  - CDN for static assets.

12. Trust, Safety, and Moderation (MVP)

- User-level controls: block, report (categories: harassment, spam, impersonation, inappropriate content, safety concern).
- Text moderation:
  - Pre-send client-side keyword check for egregious terms (advisory only).
  - Server-side moderation API (provider or rules-based) on all messages and bios.
  - Actioning: soft-block (warn), hard-block (prevent send), auto-report + queue for review.
- Image moderation:
  - On upload: content safety scan for nudity/violence.
  - EXIF scrubbing.
- Reviewer workflow (internal, MVP): basic admin dashboard to triage reports.
- Privacy: minimal data collection; values and intentions are user-controlled fields.

13. Data model (high-level)

- User(id, email, auth_provider, created_at)
- Profile(user_id, name, age, pronouns, city, photos[], bio, intentions[], values[], lifestyle_flags{}, dealbreakers[])
- Match(id, user_a, user_b, score, created_at, state[pending|mutual|closed])
- Like(id, from_user, to_user, decision[yes|pass], created_at)
- Message(id, match_id, from_user, text, created_at, moderation_status)
- Subscription(user_id, plan, status, renews_at)
- SafetyReport(id, reporter_id, subject_user_id, category, description, created_at, state)
- Events(id, user_id, type, properties, created_at)

14. Analytics and metrics

- Core funnel events: sign_up, onboarding_step_completed, profile_completed, first_like, first_match, first_message, daily_open, chat_message_sent, subscription_started, subscription_canceled.
- Dashboards: activation, retention cohorts, DAU/WAU/MAU, message depth, match-to-message rate, content moderation actions.
- Experimentation: feature flags and A/B for LLM re-rank, premium pricing, prompts.

15. Notifications and comms

- Web push: via service worker + push provider (FCM/Web Push API).
- Email: transactional (magic link, welcome, passwordless login, receipts), lifecycle nudges.
- Rate limiting and quiet hours (user-configurable).

16. Performance and reliability (MVP targets)

- PWA LCP < 2.5s on 4G mid-tier device for key screens.
- API P95 latency < 300ms for non-AI endpoints; < 1.5s for AI assistant endpoints.
- Error budget: uptime target 99.5% monthly for MVP.

17. Security & privacy (MVP)

- Account protection: session management, refresh token rotation, brute-force protection.
- Data: encrypt at rest (managed), TLS in transit, least-privileged access.
- PII minimization: avoid storing exact location; city only.
- AI hygiene: prompt redaction to remove PII before LLM calls; no raw photos to LLM.
- Compliance posture: prepare for SOC2 alignment later; log access to sensitive data.

18. Internationalization & Accessibility

- Language: English only for MVP.
- A11y: keyboard navigation, color contrast, alt text for images, semantic HTML.

19. Rollout plan

- Internal alpha (2 weeks): employees/friends; fix critical issues.
- Private beta (4–6 weeks): 200–500 users across 2–3 urban markets.
- Public waitlist: staged invites with batch size ramp.
- Decision checkpoint after first 2–3 beta cohorts based on success criteria.

20. Open questions

- Values taxonomy size and curation process.
- Premium paywall timing: pre-chat vs post-first match.
- Messaging features: read receipts default? typing indicators later?

21. Links

- Risks & assumptions: ./risk-assumptions.md
- Acceptance criteria: ./acceptance-criteria.md
