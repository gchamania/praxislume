# PraxisLume API

## Transport

The backend API is a Node/TypeScript Fastify service. Protected routes require
a Supabase JWT in the `Authorization: Bearer <token>` header. Non-test bearer
tokens are verified with Supabase Auth before generation or compliance handlers
run.

All request bodies are validated with shared Zod contracts.

## Envelopes

Success:

```json
{
  "ok": true,
  "data": {},
  "requestId": "req_123"
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "Request validation failed"
  },
  "requestId": "req_123"
}
```

## Endpoints

- `GET /health`: process health.
- `GET /ready`: readiness and config shape.
- `POST /v1/generations/campaign-plan`: creates structured campaign ideas.
- `POST /v1/generations/content-item-caption`: drafts or regenerates a caption.
- `POST /v1/generations/reel-script`: drafts a hook and short reel script.
- `POST /v1/generations/tone-rewrite`: rewrites content in a selected clinic tone.
- `POST /v1/generations/visual-asset`: pilot route for a safe generated background plus deterministic PraxisLume SVG brand overlay.
- `POST /v1/compliance/review`: runs rules-first compliance review.

Generation endpoints reserve usage before provider execution and record every
attempt to `ai_generation_logs` through the server-side generation store. The
API records successful structured output, provider failures, quota exhaustion,
and patient-data rejections without raw auth tokens or service credentials.

## AI Providers

The default provider is `fake`, which keeps local development deterministic.
Live AI is enabled per route with the backend-only `openai_compatible` adapter:

- `CAMPAIGN_PLAN_PROVIDER=fake|openai_compatible`
- `CAPTION_PROVIDER=fake|openai_compatible`
- `REEL_SCRIPT_PROVIDER=fake|openai_compatible`
- `TONE_REWRITE_PROVIDER=fake|openai_compatible`

When any route uses `openai_compatible`, the API also requires:

- `OPENAI_COMPATIBLE_BASE_URL`
- `OPENAI_COMPATIBLE_API_KEY`
- `OPENAI_COMPATIBLE_CAMPAIGN_MODEL` for campaign planning
- `OPENAI_COMPATIBLE_COPY_MODEL` for captions, reel scripts, and rewrites

The adapter calls non-streaming `/chat/completions`, requests JSON output,
validates the provider response with shared Zod schemas, and retries once with
a repair prompt when JSON parsing or schema validation fails. Provider timeout
and provider error responses are returned as generic error envelopes.

See `docs/AI_ROUTING.md` for direct provider, LiteLLM Proxy, and Vercel AI
Gateway routing notes.

Visual asset generation is disabled by default and is not subscription-core
MVP scope. When enabled, the backend may call `fake`, `fal_ai`, or
`openai_image` as the image provider. Flutter never receives image provider keys.
The image provider is
asked only for a safe background with no readable text, logo, people, patient
imagery, before/after imagery, anatomical findings, or procedure outcome
claims. PraxisLume then renders clinic logo, clinic name, doctor name, title,
CTA, colors, and disclaimer into a deterministic SVG asset and stores it in the
private `generated-assets` bucket. The OpenAI image provider is intended for a
one-image local smoke using `gpt-image-1-mini` by default.

Compliance review records metadata to `content_compliance_reviews`, including
status, issue codes, and risk notes. The raw reviewed content is not persisted
by the API review store.

## AI Safety

Generation requests may use only approved clinic context:

- specialty
- clinic services
- broad city/locality
- campaign goal
- tone
- CTA preference
- disclaimer preference

The API rejects obvious patient-identifiable inputs and logs every generation attempt without secrets or raw auth tokens.

The service-role Supabase key is used only by the backend API. Flutter receives
only public Supabase configuration and user JWTs.

## Error Categories

- `validation_error`
- `unauthorized`
- `forbidden`
- `rate_limited`
- `patient_data_rejected`
- `provider_error`
- `provider_timeout`
- `quota_exceeded`
- `feature_disabled`
- `internal_error`
