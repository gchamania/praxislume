# PraxisLume Web

Active Next.js web client for PraxisLume staging and browser demos.

## Backend Wiring

The app runs in demo mode when public env vars are absent. To connect it to the local PraxisLume stack, copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_ENABLE_VISUAL_PILOT=false`

Only the Supabase anon key belongs in this app. Service-role keys and AI provider keys stay in the backend.

## Commands

```bash
npm install
npm run test
npm run lint
npm run build
npm run dev
```

Generation, compliance review, visual asset creation, signed readback, and PNG export all go through the Fastify API with the current Supabase session token.
