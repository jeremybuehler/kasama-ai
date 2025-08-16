# Risks and Assumptions — Kasama.ai Phase 1 (Intentional Singles)

Document status: Draft v1.0
Owner: Product
Reviewers: Engineering, Data, Safety, Legal, GTM
Last updated: {{date}}

1. Demand and Market

- Assumption: There is a segment of 24–40 urban singles who actively seek values-aligned dating and will try AI guidance.
- Risk: TAM too small or difficult to reach cheaply in initial markets.
- Mitigations: Target 2–3 urban hubs with communities focused on growth; partner with creators/therapists; waitlist segmentation; fast iteration on messaging.

2. Product Experience

- Assumption: Limited daily, high-quality matches reduce burnout and increase intent.
- Risk: Daily match count feels too low and reduces perceived value.
- Mitigations: Tune N via experiment; add weekly “boost” to increase volume for motivated users.

- Assumption: AI profile assistant increases profile quality and activation.
- Risk: Generic or off-tone suggestions reduce authenticity.
- Mitigations: Provide tone sliders; show examples; allow user edits; A/B variations; limit hallucinations by grounding prompts on structured inputs.

- Assumption: Values alignment signals improve decision confidence.
- Risk: Overfitting leads to echo chambers; users want some serendipity.
- Mitigations: Diversity penalty in ranking; expose “Why this match” with transparent tradeoffs.

3. Safety and Compliance

- Risk: Inadequate moderation causes harmful experiences.
- Mitigations: Provider-based moderation + rules; rate limits; abuse detection; rapid report handling; clear ToS and enforcement.

- Risk: Privacy/PII handling for photos and bios.
- Mitigations: No facial recognition; EXIF scrubbing; do not send photos to LLM; data minimization; secure object storage.

- Risk: Harassment or off-platform escalation.
- Mitigations: Block/report flows; guidance for safe chatting; remove contact info sharing in early chats (detect and mask).

4. Technical

- Risk: LLM latency/cost instability.
- Mitigations: Deterministic baseline scoring; cache AI outputs; strict timeouts; batch processing; feature flags for LLM.

- Risk: PWA push delivery inconsistency across browsers.
- Mitigations: Email as fallback; user education; retry policies.

- Risk: Scaling Postgres for feed/match queries.
- Mitigations: Precompute daily batches; Redis cache; background workers.

5. Monetization

- Assumption: Users will pay for premium guidance and control.
- Risk: Low conversion due to unclear value.
- Mitigations: Clear value copy; free trial; time-boxed boosts; price tests; annual plan discount.

6. Analytics and Experimentation

- Risk: Incomplete instrumentation blocks learning.
- Mitigations: Define event schema pre-build; add QA dashboards; guardrail metrics for safety and fairness.

7. Fairness and Inclusion

- Risk: Matching introduces demographic bias.
- Mitigations: No race/ethnicity inputs; bias audits on outcomes; user controls for values/preferences; transparency.

8. Legal/Policy

- Risk: Age-gating and COPPA/teen policies.
- Mitigations: 18+ only; verification via attestation; future KYC out-of-scope but considered for Phase 2.

- Risk: Content/IP issues (photos, prompts).
- Mitigations: Clear license terms; takedown process.

9. Operational

- Risk: Support load during beta.
- Mitigations: In-app help, macros, office hours; simple admin tools for triage.

10. Go/No-Go Conditions

- Go if: Activation to first message ≥ 35% and D7 retention ≥ 25% for early cohorts; safety incident rate below threshold.
- No-Go if: Severe safety issues, very low activation (<20%), or unacceptable cost-to-engagement ratio.
