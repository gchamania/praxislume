# PraxisLume

PraxisLume is a Doctor Growth OS for solo doctors and small clinics. It helps clinics turn specialty, services, local context, tone, and brand identity into conservative 7, 15, or 30 day patient-education campaigns.

Core promise:

> 30 days of branded medical content in 30 minutes.

## What This MVP Is

- Flutter app for onboarding, campaign calendar, content review, manual export, and light brand kit.
- Supabase Auth, Postgres, Storage, and RLS for identity, tenant data, and assets.
- Node/TypeScript Fastify API for protected AI orchestration and compliance review.
- Shared Zod contracts for API/runtime validation.

## What This MVP Is Not

- A Canva clone.
- A generic social scheduler.
- An avatar or AI video product.
- A CRM.
- A diagnosis or treatment system.

## Local Setup

See [docs/SETUP.md](docs/SETUP.md).

On Windows PowerShell, prefer `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
```

## Key Folders

- `apps/praxislume_app`: Flutter application.
- `services/api`: Fastify backend API and AI orchestrator.
- `packages/contracts`: Shared Zod contracts.
- `supabase`: Local config, migrations, seed, and RLS verification SQL.
- `docs`: Canonical product and engineering docs.
