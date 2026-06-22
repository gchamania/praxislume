# PraxisLume Agent Contract

You are implementing PraxisLume, a Doctor Growth OS for doctors and small clinics.

## Product doctrine

PraxisLume turns a doctor's specialty, clinic details, services, brand identity, tone, location, and growth goal into a 7-, 15-, or 30-day patient-education and patient-acquisition campaign.

The core promise is:

> 30 days of branded medical content in 30 minutes.

PraxisLume is not:
- a Canva clone
- a generic social scheduler
- an avatar-first application
- a generic AI writing tool
- a full CRM
- a medical diagnosis or treatment system

## Current MVP boundary

The first release includes:
- authentication
- doctor and clinic onboarding
- specialty and service selection
- clinic profile
- basic brand kit
- content campaigns
- content calendar
- specialty-aware topic generation
- captions and reel scripts
- content statuses
- manual copy/export
- AI generation logs
- conservative compliance review

The first release excludes:
- freeform design canvas
- social publishing integrations
- WhatsApp Business API automation
- avatar generation
- AI video generation
- advanced analytics
- enterprise roles
- CRM workflows

## Preferred architecture

- Flutter frontend
- Supabase Auth, Postgres, and Storage
- Node/TypeScript backend API
- Provider-agnostic LLM adapter
- Structured JSON generation validated at runtime
- Deterministic rendering for visual assets
- Expensive AI features behind credits later

Follow the architecture and decisions recorded in `/docs`. Never silently replace the chosen stack.

## Medical safety and privacy

- Generated content is general patient education, not diagnosis or individual treatment advice.
- Never send patient-identifiable information to an LLM.
- Never add fields that encourage entering patient names, reports, phone numbers, medical record numbers, or case histories into generation prompts.
- Generated content must require doctor approval before publication.
- Flag cure guarantees, superiority claims, fearmongering, unsupported urgency, identifiable patient stories, and before/after claims without consent.
- Preserve an audit trail of AI generation and compliance review.
- Do not claim that automated checks guarantee legal, ethical, or medical compliance.

## Security

- Rely on Supabase Auth for identity.
- Enforce clinic-level access using Row Level Security.
- Never rely only on client-side authorization.
- Never commit secrets or service-role keys.
- Validate every API request and structured AI response.
- Rate-limit AI endpoints.
- Do not log access tokens, secrets, or sensitive user-submitted text.

## Cost control

- Use cheap models for bulk drafts.
- Premium review must be limited and observable.
- Log provider, model, token counts when available, latency, estimated cost, status, user, clinic, and generation type.
- Cache safe, reusable outputs where the product rules allow it.
- Do not introduce AI image, voice, avatar, or video calls into the subscription core.

## Engineering workflow

Before editing:
1. Read `/docs/SOURCE_OF_TRUTH.md`.
2. Read `/docs/CURRENT_RELEASE.md`.
3. Read relevant architecture and decision records.
4. Inspect existing code and tests.
5. State the implementation plan and files likely to change.

While editing:
- Keep changes focused on the assigned task.
- Preserve existing conventions.
- Do not refactor unrelated code.
- Do not rename public contracts without migration notes.
- Add migrations instead of editing applied migrations.
- Add tests for important behavior.
- Keep UI accessible and usable on narrow screens.

Before finishing:
- Run formatters, static analysis, unit tests, and relevant integration tests.
- Report commands run and their result.
- Report migrations, new environment variables, and manual setup steps.
- Report known limitations honestly.

## Conflict priority

When instructions conflict, use this order:
1. `/docs/SOURCE_OF_TRUTH.md`
2. `/docs/DECISIONS.md`
3. `/docs/CURRENT_RELEASE.md`
4. The assigned Codex task
5. Existing implementation conventions

Do not invent product scope to resolve a conflict. Record the conflict and choose the least expansive implementation.
