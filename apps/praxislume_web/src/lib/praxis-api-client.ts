import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  campaignPlanRequestSchema,
  campaignPlanResponseSchema,
  captionGenerationRequestSchema,
  captionGenerationResponseSchema,
  complianceReviewRequestSchema,
  complianceReviewResponseSchema,
  reelScriptRequestSchema,
  reelScriptResponseSchema,
  toneRewriteRequestSchema,
  toneRewriteResponseSchema,
  visualAssetGenerationRequestSchema,
  visualAssetGenerationResponseSchema,
  visualAssetPngExportResponseSchema,
  visualCarouselGenerationRequestSchema,
  visualCarouselGenerationResponseSchema,
  type CampaignPlanRequest,
  type CampaignPlanResponse,
  type CaptionGenerationRequest,
  type ComplianceReviewRequest,
  type ComplianceReviewResponse,
  type ReelScriptRequest,
  type ToneRewriteRequest,
  type VisualAssetGenerationRequest,
  type VisualAssetGenerationResponse,
  type VisualAssetPngExportResponse,
  type VisualCarouselGenerationRequest,
  type VisualCarouselGenerationResponse,
} from "@praxislume/contracts";
import { getWebConfig } from "./config.ts";
import { getBrowserSupabase } from "./supabase-client.ts";

type Fetcher = typeof fetch;
type ResponseSchema<T> = {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error?: unknown };
};
type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "patient_data_rejected"
  | "provider_error"
  | "provider_timeout"
  | "quota_exceeded"
  | "feature_disabled"
  | "internal_error";
type CaptionGenerationResponse = {
  caption: string;
  shortCta: string;
  disclaimerNeeded: boolean;
};
type ReelScriptResponse = {
  reelHook: string;
  reelScript: string;
  shortCta: string;
};
type ToneRewriteResponse = {
  rewrittenContent: string;
};

type ClientOptions = {
  baseUrl?: string;
  fetcher?: Fetcher;
  getAccessToken?: () => Promise<string | undefined>;
  timeoutMs?: number;
};

export class PraxisApiError extends Error {
  readonly code: ApiErrorCode | "invalid_response" | "missing_session";
  readonly requestId?: string;
  readonly status?: number;

  constructor(
    message: string,
    code: ApiErrorCode | "invalid_response" | "missing_session",
    requestId?: string,
    status?: number,
  ) {
    super(message);
    this.name = "PraxisApiError";
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

export function createPraxisApiClient(options: ClientOptions = {}) {
  const config = getWebConfig();
  const baseUrl = (options.baseUrl ?? config.apiBaseUrl).replace(/\/+$/, "");
  const fetcher = options.fetcher ?? fetch;
  const getAccessToken = options.getAccessToken ?? defaultAccessToken;
  const timeoutMs = options.timeoutMs ?? 20000;

  async function request<TData>(
    path: string,
    init: { method?: "GET" | "POST"; body?: unknown },
    responseSchema: ResponseSchema<TData>,
  ): Promise<TData> {
    if (!baseUrl) {
      throw new PraxisApiError("PraxisLume API is not configured.", "invalid_response");
    }
    const token = await getAccessToken();
    if (!token) {
      throw new PraxisApiError("A Supabase session is required.", "missing_session");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        method: init.method ?? "POST",
        headers: {
          authorization: `Bearer ${token}`,
          ...(init.body === undefined ? {} : { "content-type": "application/json" }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new PraxisApiError("PraxisLume API request timed out. Please try again.", "provider_timeout");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    const payload = await readJson(response);

    const success = apiSuccessEnvelopeSchema.safeParse(payload);
    if (response.ok && success.success) {
      const parsedData = responseSchema.safeParse(success.data.data);
      if (!parsedData.success) {
        throw new PraxisApiError("PraxisLume API response did not match the expected contract.", "invalid_response", success.data.requestId, response.status);
      }
      return parsedData.data;
    }

    const failure = apiErrorEnvelopeSchema.safeParse(payload);
    if (failure.success) {
      throw new PraxisApiError(failure.data.error.message, failure.data.error.code, failure.data.requestId, response.status);
    }

    throw new PraxisApiError("PraxisLume API response was invalid.", "invalid_response", undefined, response.status);
  }

  return {
    generateCampaignPlan(input: CampaignPlanRequest): Promise<CampaignPlanResponse> {
      return request(
        "/v1/generations/campaign-plan",
        { body: campaignPlanRequestSchema.parse(input) },
        campaignPlanResponseSchema,
      );
    },
    generateCaption(input: CaptionGenerationRequest): Promise<CaptionGenerationResponse> {
      return request(
        "/v1/generations/content-item-caption",
        { body: captionGenerationRequestSchema.parse(input) },
        captionGenerationResponseSchema,
      );
    },
    generateReelScript(input: ReelScriptRequest): Promise<ReelScriptResponse> {
      return request(
        "/v1/generations/reel-script",
        { body: reelScriptRequestSchema.parse(input) },
        reelScriptResponseSchema,
      );
    },
    rewriteTone(input: ToneRewriteRequest): Promise<ToneRewriteResponse> {
      return request(
        "/v1/generations/tone-rewrite",
        { body: toneRewriteRequestSchema.parse(input) },
        toneRewriteResponseSchema,
      );
    },
    reviewCompliance(input: ComplianceReviewRequest): Promise<ComplianceReviewResponse> {
      return request(
        "/v1/compliance/review",
        { body: complianceReviewRequestSchema.parse(input) },
        complianceReviewResponseSchema,
      );
    },
    generateVisualAsset(input: VisualAssetGenerationRequest): Promise<VisualAssetGenerationResponse> {
      return request(
        "/v1/generations/visual-asset",
        { body: visualAssetGenerationRequestSchema.parse(input) },
        visualAssetGenerationResponseSchema,
      );
    },
    fetchLatestVisualAsset(clinicId: string, contentItemId: string): Promise<VisualAssetGenerationResponse | null | undefined> {
      const query = new URLSearchParams({ clinicId, contentItemId });
      return request(
        `/v1/generations/visual-asset/latest?${query.toString()}`,
        { method: "GET" },
        visualAssetGenerationResponseSchema.nullish(),
      );
    },
    generateVisualCarousel(input: VisualCarouselGenerationRequest): Promise<VisualCarouselGenerationResponse> {
      return request(
        "/v1/generations/visual-carousel",
        { body: visualCarouselGenerationRequestSchema.parse(input) },
        visualCarouselGenerationResponseSchema,
      );
    },
    fetchLatestVisualCarousel(clinicId: string, contentItemId: string, carouselKey: string): Promise<VisualCarouselGenerationResponse | null | undefined> {
      const query = new URLSearchParams({ clinicId, contentItemId, carouselKey });
      return request(
        `/v1/generations/visual-carousel/latest?${query.toString()}`,
        { method: "GET" },
        visualCarouselGenerationResponseSchema.nullish(),
      );
    },
    exportVisualAssetPng(assetId: string): Promise<VisualAssetPngExportResponse> {
      return request(
        `/v1/generations/visual-asset/${encodeURIComponent(assetId)}/png-export`,
        { body: {} },
        visualAssetPngExportResponseSchema,
      );
    },
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function defaultAccessToken(): Promise<string | undefined> {
  const { data } = await getBrowserSupabase().auth.getSession();
  return data.session?.access_token;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
