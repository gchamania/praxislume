# PraxisLume Decisions

## ADR-001: Lean Typed Stack

Status: accepted

Decision: use Flutter with Riverpod and `go_router`, Node/TypeScript Fastify API, Zod contracts, Vitest tests, Pino logs, and Supabase for auth/database/storage.

Reason: the stack keeps the app portable, strongly typed at service boundaries, quick to bootstrap, and simple enough for v0.1/v0.2.

## ADR-002: Supabase Auth and RLS Are Mandatory

Status: accepted

Decision: Supabase Auth is the only identity source. Tenant access is enforced through Postgres RLS and server-side clinic-context checks.

Reason: client-side authorization is not enough for clinic data. RLS gives a default deny layer for direct Supabase CRUD.

## ADR-003: Backend Owns AI Provider Calls

Status: accepted

Decision: Flutter never calls LLM providers. All generation and compliance routes go through the backend API and provider-agnostic adapter.

Reason: provider keys, prompt versions, cost tracking, quota checks, and structured-output repair belong on the server.

## ADR-004: Deterministic Templates Over Canvas Editing

Status: accepted

Decision: visual output uses deterministic templates and controlled brand kit fields. v0.1/v0.2 includes a brand preview only.

Reason: the MVP promise is campaign output, not design editing. This avoids Canva-clone scope creep.

## ADR-005: No Avatar, Video, Social Publishing, or CRM in MVP

Status: accepted

Decision: avatar/video generation, social publishing APIs, WhatsApp Business automation, CRM workflows, and advanced analytics are deferred until after pilot validation.

Reason: these features add cost, risk, compliance scope, and integration complexity before the core workflow is proven.

## ADR-006: Log Every AI Generation

Status: accepted

Decision: every generation attempt records clinic/user, generation type, prompt version or hash, provider, model, token counts when available, latency, estimated cost when available, status, and error category.

Reason: cost control, debugging, compliance review, and auditability are core product requirements.

## ADR-007: Never Send Patient-Identifiable Data to LLMs

Status: accepted

Decision: generation inputs use approved clinic context only and reject obvious patient-identifiable data before provider calls.

Reason: PraxisLume is a patient-education marketing tool, not a patient case analysis product.

## ADR-008: OpenAI-Compatible Routing First

Status: accepted

Decision: add live AI through PraxisLume's own backend provider adapter using an OpenAI-compatible `/chat/completions` interface. LiteLLM Proxy and Vercel AI Gateway remain compatible routing options, not required local infrastructure.

Reason: the adapter gives route-specific model control, prompt logging, schema repair, and cost observability now, while keeping future provider routing an environment-only change.
