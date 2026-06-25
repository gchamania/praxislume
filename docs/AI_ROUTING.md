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
OPENAI_COMPATIBLE_THINKING=
OPENAI_COMPATIBLE_REASONING_EFFORT=
```

`CAMPAIGN_PLAN_PROVIDER`, `CAPTION_PROVIDER`, `REEL_SCRIPT_PROVIDER`, and
`TONE_REWRITE_PROVIDER` inherit `AI_PROVIDER` only when left unset. Prefer
explicit per-route values in staging and production so models can be changed
independently.

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

For DeepSeek V4 JSON generation, set:

```env
OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com
OPENAI_COMPATIBLE_CAMPAIGN_MODEL=deepseek-v4-pro
OPENAI_COMPATIBLE_COPY_MODEL=deepseek-v4-flash
OPENAI_COMPATIBLE_THINKING=disabled
OPENAI_COMPATIBLE_REASONING_EFFORT=high
```

`OPENAI_COMPATIBLE_THINKING=disabled` keeps DeepSeek in non-thinking mode for
structured JSON reliability. If `OPENAI_COMPATIBLE_THINKING=enabled`, the API
can also send `OPENAI_COMPATIBLE_REASONING_EFFORT=high|max`.

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

## Visual Asset Pilot

Visual asset generation is a local staging pilot, not MVP subscription core. It
is disabled by default:

```env
IMAGE_GENERATION_ENABLED=false
IMAGE_PROVIDER=fake
FAL_KEY=
FAL_IMAGE_MODEL=fal-ai/flux/schnell
FAL_RUN_BASE_URL=https://fal.run
OPENAI_IMAGE_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1-mini
OPENAI_IMAGE_BASE_URL=https://api.openai.com/v1
IMAGE_GENERATION_DAILY_LIMIT=1
```

To test the local fake path, set:

```env
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=fake
```

To test fal.ai, keep the key only in `services/api/.env` or deployment
secrets:

```env
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=fal_ai
FAL_KEY=<server-only-fal-key>
FAL_IMAGE_MODEL=fal-ai/flux/schnell
FAL_RUN_BASE_URL=https://fal.run
```

To test a single OpenAI image background, keep the key only in
`services/api/.env` or deployment secrets:

```env
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=openai_image
OPENAI_IMAGE_API_KEY=<server-only-openai-key>
OPENAI_IMAGE_MODEL=gpt-image-1-mini
OPENAI_IMAGE_BASE_URL=https://api.openai.com/v1
IMAGE_GENERATION_DAILY_LIMIT=1
```

The visual route uses `POST /v1/generations/visual-asset`. The provider prompt
asks only for a safe background. It explicitly excludes readable text, clinic
logos, people, patient imagery, before/after images, anatomical findings, and
procedure outcome claims. PraxisLume renders the clinic logo, clinic name,
doctor name, title, CTA, colors, and disclaimer afterward as deterministic SVG
layers and stores the final asset in the private `generated-assets` bucket.
The fal.ai route uses direct synchronous model inference against
`https://fal.run/<model-id>` with `Authorization: Key $FAL_KEY`, then downloads
the returned image URL server-side before storing the PraxisLume-rendered SVG.
The OpenAI image route uses `POST /images/generations`, requests one
`1024x1024` PNG from `gpt-image-1-mini` by default, reads the returned base64
image, and stores only the deterministic PraxisLume-rendered SVG asset.

## Deferred

Model-assisted compliance review, embeddings, voice, avatar, AI video, social
publishing, CRM workflows, and Canva-style editing remain post-MVP decisions.
AI image generation is present only as a disabled-by-default local staging pilot
with backend logging, quota, storage isolation, and no freeform patient prompt
surface.
