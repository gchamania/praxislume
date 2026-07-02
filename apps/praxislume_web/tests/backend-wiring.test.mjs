import assert from "node:assert/strict";
import test from "node:test";

import { createPraxisApiClient, PraxisApiError } from "../src/lib/praxis-api-client.ts";
import { readWebConfig } from "../src/lib/config.ts";
import { contentHash, itemsFromCampaignPlan } from "../src/lib/praxis-actions.ts";
import { contentItemFromRow, brandKitFromRow } from "../src/lib/praxis-repository.ts";
import { clearSupabaseAuthStorage } from "../src/lib/supabase-client.ts";
import { runAuthAction } from "../src/lib/auth-action.ts";

test("web config normalizes public environment and keeps demo fallback explicit", () => {
  const missing = readWebConfig({});
  assert.equal(missing.isBackendConfigured, false);
  assert.equal(missing.demoMode, true);
  assert.equal(missing.enableVisualPilot, false);
  assert.equal(missing.preAiConveyorMode, true);

  const configured = readWebConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000///",
    NEXT_PUBLIC_ENABLE_VISUAL_PILOT: "true",
  });

  assert.equal(configured.isBackendConfigured, true);
  assert.equal(configured.demoMode, false);
  assert.equal(configured.apiBaseUrl, "http://localhost:3000");
  assert.equal(configured.enableVisualPilot, true);
  assert.equal(configured.preAiConveyorMode, true);

  const liveAiConfigured = readWebConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_PRE_AI_CONVEYOR: "false",
  });
  assert.equal(liveAiConfigured.preAiConveyorMode, false);
});

test("clears stale Supabase auth storage without removing unrelated app keys", () => {
  const storage = memoryStorage({
    "sb-localhost-auth-token": "{\"refresh_token\":\"stale\"}",
    "supabase.auth.token": "{\"legacy\":true}",
    "praxislume-theme": "dark",
  });

  clearSupabaseAuthStorage(storage);

  assert.equal(storage.getItem("sb-localhost-auth-token"), null);
  assert.equal(storage.getItem("supabase.auth.token"), null);
  assert.equal(storage.getItem("praxislume-theme"), "dark");
});

test("auth action failures become page messages instead of rejected promises", async () => {
  const events = [];
  const result = await runAuthAction(
    async () => {
      throw new Error("Invalid login credentials");
    },
    {
      setStatus: (status) => events.push(["status", status]),
      setMessage: (message) => events.push(["message", message]),
    },
  );

  assert.equal(result, false);
  assert.deepEqual(events, [
    ["status", "saving"],
    ["message", undefined],
    ["status", "error"],
    ["message", "Invalid login credentials"],
  ]);
});

function memoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    get length() {
      return entries.size;
    },
    key(index) {
      return Array.from(entries.keys())[index] ?? null;
    },
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}

test("api client attaches Supabase bearer token and unwraps validated success envelopes", async () => {
  const requests = [];
  const client = createPraxisApiClient({
    baseUrl: "http://localhost:3000",
    getAccessToken: async () => "jwt-token",
    fetcher: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse(200, {
        ok: true,
        requestId: "req_123",
        data: {
          items: [
            {
              dayOffset: 0,
              title: "Ear grommet basics",
              category: "procedure_explainer",
              objective: "Educate parents",
              keyPoints: ["Fluid can affect hearing"],
              caption: "General education caption",
              shortCta: "Book an ENT consultation",
              disclaimerNeeded: true,
            },
          ],
        },
      });
    },
  });

  const result = await client.generateCampaignPlan({
    clinicId: "56c55f12-5ab3-4831-9e4f-44390f06b531",
    idempotencyKey: "campaign-test-key",
    durationDays: 7,
    specialty: "ENT",
    services: ["Grommet consultation"],
    locality: "Pune",
    goal: "increase appointment enquiries",
    tone: "warm",
    ctaPreference: "Book an ENT consultation",
    disclaimerPreference: "Educational content only.",
  });

  assert.equal(result.items[0].title, "Ear grommet basics");
  assert.equal(requests[0].url, "http://localhost:3000/v1/generations/campaign-plan");
  assert.equal(requests[0].init.headers.authorization, "Bearer jwt-token");
  assert.equal(requests[0].init.headers["content-type"], "application/json");
});

test("api client surfaces backend error envelopes with code and request id", async () => {
  const client = createPraxisApiClient({
    baseUrl: "http://localhost:3000",
    getAccessToken: async () => "jwt-token",
    fetcher: async () =>
      jsonResponse(429, {
        ok: false,
        requestId: "req_rate",
        error: { code: "rate_limited", message: "Slow down." },
      }),
  });

  await assert.rejects(
    () =>
      client.generateCaption({
        clinicId: "56c55f12-5ab3-4831-9e4f-44390f06b531",
        title: "Ear care",
        specialty: "ENT",
        tone: "warm",
        keyPoints: ["Avoid unsafe cleaning"],
        ctaPreference: "Book an ENT consultation",
      }),
    (error) => {
      assert.ok(error instanceof PraxisApiError);
      assert.equal(error.code, "rate_limited");
      assert.equal(error.requestId, "req_rate");
      assert.equal(error.status, 429);
      return true;
    },
  );
});

test("api client aborts slow generation calls with a provider timeout error", async () => {
  const client = createPraxisApiClient({
    baseUrl: "http://localhost:3000",
    getAccessToken: async () => "jwt-token",
    timeoutMs: 1,
    fetcher: async (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      }),
  });

  await assert.rejects(
    () =>
      client.generateCaption({
        clinicId: "56c55f12-5ab3-4831-9e4f-44390f06b531",
        title: "Ear care",
        specialty: "ENT",
        tone: "warm",
        keyPoints: ["Avoid unsafe cleaning"],
        ctaPreference: "Book an ENT consultation",
      }),
    (error) => {
      assert.ok(error instanceof PraxisApiError);
      assert.equal(error.code, "provider_timeout");
      return true;
    },
  );
});

test("repository mappers preserve Supabase row defaults used by Flutter", () => {
  assert.deepEqual(
    brandKitFromRow({
      primary_color: "",
      secondary_color: "",
      accent_color: "",
      tone: "",
      default_cta: "",
      disclaimer_text: "",
      logo_path: "clinic/logo.png",
    }),
    {
      primaryColor: "#0D4D57",
      secondaryColor: "#A7E1D6",
      accentColor: "#F2C15E",
      tone: "warm",
      defaultCta: "Book a consultation",
      disclaimer:
        "This content is for general education only. Please consult a qualified doctor for personal medical advice.",
      logoPath: "clinic/logo.png",
    },
  );

  assert.deepEqual(
    contentItemFromRow({
      id: "item-1",
      clinic_id: "clinic-1",
      campaign_id: "campaign-1",
      scheduled_date: "2026-06-29",
      day_offset: 2,
      title: "What are ear grommets?",
      category: "procedure_explainer",
      status: "drafted",
      objective: "Explain safely",
      key_points: ["Tiny tubes", "ENT review"],
      caption: "Caption",
      reel_hook: "Hook",
      reel_script: "Script",
      short_cta: "Book an ENT consultation",
      disclaimer_text: "Educational only.",
      compliance_review_status: "passed",
      content_version_hash: "hash",
    }),
    {
      id: "item-1",
      clinicId: "clinic-1",
      campaignId: "campaign-1",
      scheduledDate: "2026-06-29",
      dayOffset: 2,
      title: "What are ear grommets?",
      category: "procedure_explainer",
      status: "drafted",
      objective: "Explain safely",
      keyPoints: ["Tiny tubes", "ENT review"],
      caption: "Caption",
      reelHook: "Hook",
      reelScript: "Script",
      shortCta: "Book an ENT consultation",
      disclaimer: "Educational only.",
      complianceStatus: "passed",
      contentVersionHash: "hash",
    },
  );
});

test("campaign plan output maps into persistable content items without patient prompt fields", () => {
  const items = itemsFromCampaignPlan({
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    startDate: "2026-06-29",
    disclaimer: "Educational only.",
    planItems: [
      {
        dayOffset: 3,
        title: "Safe ear cleaning myths",
        category: "myth_buster",
        objective: "Reduce unsafe habits",
        keyPoints: ["Avoid inserting objects"],
        caption: "Safe general education copy.",
        shortCta: "Ask an ENT specialist",
        reelHook: "Still using cotton buds?",
        reelScript: "Explain safer ear care.",
        disclaimerNeeded: true,
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].scheduledDate, "2026-07-02");
  assert.equal(items[0].status, "drafted");
  assert.equal(items[0].contentVersionHash, contentHash("Safe general education copy."));
  assert.equal("patientName" in items[0], false);
  assert.equal("phoneNumber" in items[0], false);
});

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}
