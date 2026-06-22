# PraxisLume API

## Transport

The backend API is a Node/TypeScript Fastify service. Protected routes require a Supabase JWT in the `Authorization: Bearer <token>` header.

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
- `POST /v1/compliance/review`: runs rules-first compliance review.

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

## Error Categories

- `validation_error`
- `unauthorized`
- `forbidden`
- `rate_limited`
- `patient_data_rejected`
- `provider_error`
- `provider_timeout`
- `quota_exceeded`
- `internal_error`
