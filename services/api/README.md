# PraxisLume API

Fastify backend for protected AI generation, compliance review, logging, and future integration boundaries.

Flutter performs normal Supabase Auth and RLS-protected CRUD directly. Generation and compliance calls go through this API with the user's Supabase JWT.

Non-test bearer tokens are verified with Supabase Auth before protected handlers
run. Test-token bypass is available only through explicit test app options.

In non-test environments the API writes generation attempts to
`ai_generation_logs`, reserves daily usage in `usage_credits`, and records
compliance review metadata in `content_compliance_reviews` through server-only
Supabase adapters. Tests default to in-memory stores.
