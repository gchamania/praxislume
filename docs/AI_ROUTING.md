# PraxisLume AI Routing

PraxisLume uses its own backend provider adapter first. Flutter never calls an
LLM provider directly and never receives provider API keys.

The current live adapter is `openai_compatible`, which uses non-streaming
`POST /chat/completions` and strict JSON responses. That keeps routing
replaceable without changing Flutter or the public API contracts.

## Route Selection

Default local development stays deterministic:

```env
AI_PROVIDER=fake
CAMPAIGN_PLAN_PROVIDER=fake
CAPTION_PROVIDER=fake
REEL_SCRIPT_PROVIDER=fake
TONE_REWRITE_PROVIDER=fake
```

Enable live AI one route at a time:

```env
CAMPAIGN_PLAN_PROVIDER=openai_compatible
CAPTION_PROVIDER=openai_compatible
REEL_SCRIPT_PROVIDER=openai_compatible
TONE_REWRITE_PROVIDER=openai_compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_API_KEY=server-only-key
OPENAI_COMPATIBLE_CAMPAIGN_MODEL=campaign-planner-model
OPENAI_COMPATIBLE_COPY_MODEL=copywriter-model
OPENAI_COMPATIBLE_THINKING=disabled
OPENAI_COMPATIBLE_REASONING_EFFORT=high
```

`CAMPAIGN_PLAN_PROVIDER`, `CAPTION_PROVIDER`, `REEL_SCRIPT_PROVIDER`, and
`TONE_REWRITE_PROVIDER` inherit `AI_PROVIDER` only when left unset. Prefer
explicit per-route values in staging and production so models can be changed
independently.

## DeepSeek V4 Pilot

DeepSeek V4 is routed through the same backend-only `openai_compatible`
adapter. For the Day 3 pilot, use the higher-quality model for the 30-day
planner and the lower-cost model for copy routes:

```env
CAMPAIGN_PLAN_PROVIDER=openai_compatible
CAPTION_PROVIDER=openai_compatible
REEL_SCRIPT_PROVIDER=openai_compatible
TONE_REWRITE_PROVIDER=openai_compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com
OPENAI_COMPATIBLE_API_KEY=<server-only-deepseek-key>
OPENAI_COMPATIBLE_CAMPAIGN_MODEL=deepseek-v4-pro
OPENAI_COMPATIBLE_COPY_MODEL=deepseek-v4-flash
OPENAI_COMPATIBLE_THINKING=disabled
OPENAI_COMPATIBLE_REASONING_EFFORT=high
```

Keep `OPENAI_COMPATIBLE_THINKING=disabled` for structured JSON reliability
unless a live smoke proves the provider can return strict schema-conformant JSON
with thinking enabled.

## Visual Asset Pilot

`POST /v1/generations/visual-asset` is a backend-only, disabled-by-default pilot
path for safe abstract thumbnails. It is not part of the v0.1/light v0.2 core
subscription promise and must not become a Canva-style editor.

```env
IMAGE_GENERATION_ENABLED=false
IMAGE_PROVIDER=fake
IMAGE_COMPATIBLE_BASE_URL=
IMAGE_COMPATIBLE_API_KEY=
IMAGE_COMPATIBLE_MODEL=
IMAGE_COMPATIBLE_GENERATIONS_PATH=/images/generations
IMAGE_GENERATION_DAILY_LIMIT=5
```

When enabled, the backend builds prompts only from safe clinic/content context
and stores outputs in the private `generated-assets` bucket under
`<clinic_id>/...` paths. Flutter receives only a short-lived signed URL returned
by the PraxisLume API. Do not add freeform patient image prompts, patient faces,
before/after imagery, anatomical findings, procedure outcomes, avatar/video
calls, or provider keys to Flutter.

## Compatible Gateways

`OPENAI_COMPATIBLE_BASE_URL` can point to any service that exposes an
OpenAI-compatible chat-completions API:

- Direct provider API, for example `https://api.openai.com/v1`
- [LiteLLM Proxy](https://docs.litellm.ai/docs/) for virtual keys, routing,
  budgets, and provider failover
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) for managed model
  access, observability, budgets, and fallback routing

LiteLLM and Vercel AI Gateway are compatible infrastructure options, not hard
local-development dependencies.

## Safety And Audit Rules

- Patient-identifiable input is rejected before provider calls.
- Requests use clinic-level context only: specialty, services, locality, tone,
  CTA, disclaimer, and safe campaign goals.
- Provider output must be strict JSON and pass shared Zod contracts.
- Invalid JSON or schema failures get one repair attempt, then fail closed.
- Every generation attempt logs provider, model, generation type, prompt
  version/hash, latency, status, error category, and token counts when returned.
- Logs must not include provider keys, service-role keys, raw auth tokens, or
  patient-identifiable prompt text.

## Deferred

Model-assisted compliance review, embeddings, voice, avatar, AI video, social
publishing, CRM workflows, and Canva-style editing remain post-MVP decisions.
AI image generation is present only as the guarded visual asset pilot above.
