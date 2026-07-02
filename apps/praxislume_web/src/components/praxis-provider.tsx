"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthError,
  Session,
  User,
} from "@supabase/supabase-js";
import type {
  VisualAssetGenerationResponse,
  VisualAssetPngExportResponse,
  VisualCarouselGenerationRequest,
  VisualCarouselGenerationResponse,
} from "@praxislume/contracts";
import { contentItems, doctor } from "@/lib/dummy-data";
import { getWebConfig, type WebConfig } from "@/lib/config";
import { createPraxisApiClient } from "@/lib/praxis-api-client";
import { clearSupabaseAuthStorage, getBrowserSupabase } from "@/lib/supabase-client";
import {
  SupabasePraxisRepository,
  createCampaignFromPlan,
  emptyState,
} from "@/lib/praxis-repository";
import { contentHash, dateOnlyAfter, itemsFromCampaignPlan } from "@/lib/praxis-actions";
import {
  defaultBrandKit,
  type BrandKit,
  type ContentItem,
  type PraxisState,
} from "@/lib/praxis-models";
import { runAuthAction } from "@/lib/auth-action";
import {
  buildCampaignPlanRequest,
  campaignSetupHasPatientData,
  createCampaignTitle,
  type CampaignSetupInput,
} from "@/features/campaigns/campaign-setup";

type SaveOnboardingInput = {
  doctorName: string;
  qualifications: string;
  specialty: string;
  clinicName: string;
  locality: string;
  city: string;
  services: string[];
  phone: string;
};

type PraxisContextValue = {
  config: WebConfig;
  mode: "demo" | "live";
  status: "loading" | "ready" | "saving" | "generating" | "error";
  message?: string;
  user?: User;
  session?: Session;
  state: PraxisState;
  activeVisualAsset?: VisualAssetGenerationResponse | VisualAssetPngExportResponse;
  activeVisualItemId?: string;
  activeCarousel?: VisualCarouselGenerationResponse;
  signIn(identifier: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
  saveOnboarding(input: SaveOnboardingInput): Promise<void>;
  saveBrandKit(brandKit: BrandKit): Promise<void>;
  uploadLogo(file: File): Promise<void>;
  generateCampaign(setup: CampaignSetupInput): Promise<boolean>;
  regenerateCaption(itemId: string): Promise<void>;
  generateReelScript(itemId: string): Promise<void>;
  rewriteTone(itemId: string): Promise<void>;
  reviewCompliance(itemId: string): Promise<void>;
  updateContentItem(itemId: string, patch: Partial<ContentItem>): Promise<void>;
  generateVisualAsset(itemId: string): Promise<void>;
  fetchLatestVisualAsset(itemId: string): Promise<void>;
  generateVisualCarousel(itemId: string): Promise<void>;
  fetchLatestVisualCarousel(itemId: string): Promise<void>;
  exportVisualAssetPng(): Promise<void>;
};

const PraxisContext = createContext<PraxisContextValue | undefined>(undefined);
const preAiStateStorageKey = "praxislume-pre-ai-state";

export function PraxisProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getWebConfig(), []);
  const [status, setStatus] = useState<PraxisContextValue["status"]>("loading");
  const [message, setMessage] = useState<string>();
  const [session, setSession] = useState<Session>();
  const [user, setUser] = useState<User>();
  const [state, setState] = useState<PraxisState>(() => (config.preAiConveyorMode ? readPreAiState() : demoState()));
  const [activeVisualAsset, setActiveVisualAsset] = useState<VisualAssetGenerationResponse | VisualAssetPngExportResponse>();
  const [activeVisualItemId, setActiveVisualItemId] = useState<string>();
  const [activeCarousel, setActiveCarousel] = useState<VisualCarouselGenerationResponse>();
  const router = useRouter();

  const localConveyorMode = config.demoMode || config.preAiConveyorMode;
  const mode = localConveyorMode ? "demo" : "live";

  const repository = useCallback(() => new SupabasePraxisRepository(getBrowserSupabase()), []);
  const api = useCallback(() => createPraxisApiClient(), []);

  const refresh = useCallback(async () => {
    if (localConveyorMode) {
      setState(config.preAiConveyorMode ? readPreAiState() : demoState());
      setStatus("ready");
      setMessage(config.preAiConveyorMode ? "Pre-AI conveyor mode: deterministic local campaign data is active." : "Demo mode: add public Supabase and API env vars to use live data.");
      return;
    }
    setStatus("loading");
    try {
      const supabase = getBrowserSupabase();
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? undefined);
      setUser(data.session?.user);
      setState(data.session ? await repository().load() : emptyState());
      setStatus("ready");
      setMessage(data.session ? undefined : "Sign in to access your PraxisLume clinic workspace.");
    } catch {
      clearSupabaseAuthStorage();
      setSession(undefined);
      setUser(undefined);
      setState(emptyState());
      setStatus("ready");
      setMessage("Your previous local session expired. Please sign in again.");
    }
  }, [config.preAiConveyorMode, localConveyorMode, repository]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    if (localConveyorMode) {
      return () => window.clearTimeout(initialRefresh);
    }
    let data: ReturnType<ReturnType<typeof getBrowserSupabase>["auth"]["onAuthStateChange"]>["data"];
    try {
      const supabase = getBrowserSupabase();
      ({ data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession ?? undefined);
        setUser(nextSession?.user);
        void refresh();
      }));
    } catch {
      clearSupabaseAuthStorage();
      window.setTimeout(() => void refresh(), 0);
    }
    return () => {
      window.clearTimeout(initialRefresh);
      data?.subscription.unsubscribe();
    };
  }, [localConveyorMode, refresh]);

  useEffect(() => {
    if (!config.preAiConveyorMode) return;
    window.localStorage.setItem(preAiStateStorageKey, JSON.stringify(state));
  }, [config.preAiConveyorMode, state]);

  const withMutation = useCallback(
    async (label: PraxisContextValue["status"], task: () => Promise<void>): Promise<boolean> => {
      setStatus(label);
      setMessage(undefined);
      try {
        if (!localConveyorMode && !session) {
          throw new Error("A Supabase session is required.");
        }
        await task();
        setStatus("ready");
        return true;
      } catch (error) {
        setStatus("error");
        setMessage(errorMessage(error));
        return false;
      }
    },
    [localConveyorMode, session],
  );

  const value = useMemo<PraxisContextValue>(
    () => ({
      config,
      mode,
      status,
      message,
      user,
      session,
      state,
      activeVisualAsset,
      activeVisualItemId,
      activeCarousel,
      async signIn(identifier, password) {
        if (localConveyorMode) {
          setMessage("Demo mode: sign-in is simulated until public env vars are configured.");
          router.push("/dashboard");
          return;
        }
        const ok = await runAuthAction(
          async () => {
            const login = authIdentifierPayload(identifier);
            const { error } = await getBrowserSupabase().auth.signInWithPassword({ ...login, password });
            handleAuthError(error);
            await refresh();
          },
          { setStatus, setMessage },
        );
        if (ok) {
          router.push("/dashboard");
        }
      },
      async signUp(email, password, displayName) {
        if (localConveyorMode) {
          setMessage("Demo mode: account creation is simulated until public env vars are configured.");
          router.push("/onboarding/clinic-details");
          return;
        }
        const ok = await runAuthAction(
          async () => {
            const { error } = await getBrowserSupabase().auth.signUp({
              email,
              password,
              options: { data: { display_name: displayName } },
            });
            handleAuthError(error);
            await refresh();
          },
          { setStatus, setMessage },
        );
        if (ok) {
          router.push("/onboarding/clinic-details");
        }
      },
      async signOut() {
        if (!localConveyorMode) {
          await getBrowserSupabase().auth.signOut();
        }
        setSession(undefined);
        setUser(undefined);
        if (config.preAiConveyorMode) {
          window.localStorage.removeItem(preAiStateStorageKey);
        }
        setState(localConveyorMode ? demoState() : emptyState());
        router.push("/signin");
      },
      refresh,
      async saveOnboarding(input) {
        await withMutation("saving", async () => {
          if (localConveyorMode) {
            setState((current) => ({
              ...current,
              clinic: {
                id: current.clinic?.id ?? "56c55f12-5ab3-4831-9e4f-44390f06b531",
                name: input.clinicName,
                locality: input.locality,
                city: input.city,
                services: input.services,
                phone: input.phone,
                whatsapp: input.phone,
              },
              doctor: {
                id: current.doctor?.id ?? "demo-doctor",
                name: input.doctorName,
                qualifications: input.qualifications,
                specialty: input.specialty,
              },
            }));
            return;
          }
          setState(await repository().saveOnboarding({ state, ...input }));
        });
      },
      async saveBrandKit(brandKit) {
        await withMutation("saving", async () => {
          if (localConveyorMode) {
            setState((current) => ({ ...current, brandKit }));
            return;
          }
          setState(await repository().saveBrandKit({ state, brandKit }));
        });
      },
      async uploadLogo(file) {
        await withMutation("saving", async () => {
          if (localConveyorMode) {
            setMessage(`Demo logo selected: ${file.name}`);
            return;
          }
          setState(await repository().uploadLogo({ state, file }));
        });
      },
      async generateCampaign(setup) {
        return withMutation("generating", async () => {
          const safety = campaignSetupHasPatientData(setup);
          if (!safety.ok) {
            throw new Error(safety.reason);
          }
          const clinic = requireClinic(state);
          const profile = requireDoctor(state);
          const title = createCampaignTitle({
            durationDays: setup.durationDays,
            specialty: profile.specialty,
            topicFocus: setup.topicFocus,
          });
          if (localConveyorMode) {
            const campaign = createCampaignFromPlan({
              clinicId: clinic.id,
              title,
              goal: setup.growthGoal,
              durationDays: setup.durationDays,
              startDate: dateOnlyAfter(0),
            });
            const items = demoState().items.slice(0, Math.min(setup.durationDays, contentItems.length)).map((item, index) => ({
              ...item,
              id: `demo-generated-${index}`,
              clinicId: clinic.id,
              campaignId: campaign.id,
              dayOffset: index,
              scheduledDate: dateOnlyAfter(index),
              objective: `${setup.topicFocus} for ${setup.audience}`,
            }));
            setState((current) => ({ ...current, campaign, items }));
            setMessage(config.preAiConveyorMode ? "Pre-AI conveyor mode: deterministic campaign plan created locally." : undefined);
            return;
          }
          const plan = await api().generateCampaignPlan(
            buildCampaignPlanRequest({
              clinic,
              doctor: profile,
              brandKit: state.brandKit,
              setup,
              idempotencyKey: `web-campaign-${clinic.id}-${setup.durationDays}-${Date.now()}`,
            }),
          );
          const campaign = createCampaignFromPlan({
            clinicId: clinic.id,
            title,
            goal: setup.growthGoal,
            durationDays: setup.durationDays,
            startDate: dateOnlyAfter(0),
          });
          const items = itemsFromCampaignPlan({
            clinicId: clinic.id,
            campaignId: campaign.id,
            startDate: campaign.startDate,
            disclaimer: state.brandKit.disclaimer,
            planItems: plan.items,
          });
          setState(await repository().saveCampaignPackage({ state, campaign, items }));
        });
      },
      async regenerateCaption(itemId) {
        await withMutation("generating", async () => {
          const clinic = requireClinic(state);
          const profile = requireDoctor(state);
          const item = requireItem(state, itemId);
          if (localConveyorMode) {
            const caption = `${item.title}: a safe patient-education note from ${clinic.name}.`;
            setState((current) => patchItem(current, itemId, { caption, contentVersionHash: contentHash(caption), status: "drafted" }));
            return;
          }
          const draft = await api().generateCaption({
            clinicId: clinic.id,
            title: item.title,
            specialty: profile.specialty,
            services: clinic.services,
            locality: clinic.locality,
            tone: state.brandKit.tone,
            keyPoints: item.keyPoints.length ? item.keyPoints : [item.objective || item.title],
            ctaPreference: state.brandKit.defaultCta,
            disclaimerPreference: state.brandKit.disclaimer,
          });
          const patch = {
            caption: draft.caption,
            shortCta: draft.shortCta,
            disclaimer: draft.disclaimerNeeded ? state.brandKit.disclaimer : "",
            contentVersionHash: contentHash(draft.caption),
          };
          await repository().updateContentItem({
            state,
            itemId,
            patch,
          });
          setState((current) => patchItem(current, itemId, patch));
        });
      },
      async generateReelScript(itemId) {
        await withMutation("generating", async () => {
          const clinic = requireClinic(state);
          const profile = requireDoctor(state);
          const item = requireItem(state, itemId);
          if (localConveyorMode) {
            setState((current) => patchItem(current, itemId, { reelHook: `Parents ask this about ${item.title}`, reelScript: "Open with the concern, explain generally, close with an ENT review CTA." }));
            return;
          }
          const draft = await api().generateReelScript({
            clinicId: clinic.id,
            title: item.title,
            specialty: profile.specialty,
            services: clinic.services,
            locality: clinic.locality,
            tone: state.brandKit.tone,
            keyPoints: item.keyPoints.length ? item.keyPoints : [item.objective || item.title],
            ctaPreference: state.brandKit.defaultCta,
            disclaimerPreference: state.brandKit.disclaimer,
          });
          const patch = {
            reelHook: draft.reelHook,
            reelScript: draft.reelScript,
            shortCta: draft.shortCta,
          };
          await repository().updateContentItem({
            state,
            itemId,
            patch,
          });
          setState((current) => patchItem(current, itemId, patch));
        });
      },
      async rewriteTone(itemId) {
        await withMutation("generating", async () => {
          const clinic = requireClinic(state);
          const profile = requireDoctor(state);
          const item = requireItem(state, itemId);
          if (localConveyorMode) {
            setState((current) => patchItem(current, itemId, { caption: `${item.caption} ${state.brandKit.defaultCta}`.trim() }));
            return;
          }
          const rewrite = await api().rewriteTone({
            clinicId: clinic.id,
            content: item.caption || item.title,
            tone: state.brandKit.tone,
            specialty: profile.specialty,
            services: clinic.services,
            locality: clinic.locality,
            ctaPreference: state.brandKit.defaultCta,
            disclaimerPreference: state.brandKit.disclaimer,
          });
          const patch = {
            caption: rewrite.rewrittenContent,
            contentVersionHash: contentHash(rewrite.rewrittenContent),
          };
          await repository().updateContentItem({
            state,
            itemId,
            patch,
          });
          setState((current) => patchItem(current, itemId, patch));
        });
      },
      async reviewCompliance(itemId) {
        await withMutation("generating", async () => {
          const clinic = requireClinic(state);
          const item = requireItem(state, itemId);
          const hash = item.contentVersionHash || contentHash(item.caption || item.title);
          if (localConveyorMode) {
            setState((current) => patchItem(current, itemId, { complianceStatus: "passed", contentVersionHash: hash }));
            return;
          }
          const review = await api().reviewCompliance({
            clinicId: clinic.id,
            content: item.caption || item.title,
            contentVersionHash: hash,
          });
          const patch = {
            complianceStatus: review.status,
            caption: review.saferRewrite ?? item.caption,
            contentVersionHash: review.reviewedContentVersionHash,
          };
          await repository().updateContentItem({
            state,
            itemId,
            patch,
          });
          setState((current) => patchItem(current, itemId, patch));
        });
      },
      async updateContentItem(itemId, patch) {
        await withMutation("saving", async () => {
          const nextPatch = {
            ...patch,
            ...(patch.caption !== undefined ? { contentVersionHash: contentHash(patch.caption) } : {}),
          };
          if (localConveyorMode) {
            setState((current) => patchItem(current, itemId, nextPatch));
            return;
          }
          await repository().updateContentItem({ state, itemId, patch: nextPatch });
          setState((current) => patchItem(current, itemId, nextPatch));
        });
      },
      async generateVisualAsset(itemId) {
        await withMutation("generating", async () => {
          if (!config.enableVisualPilot) {
            setMessage("Visual pilot is disabled in the web app.");
            return;
          }
          const clinic = requireClinic(state);
          const profile = requireDoctor(state);
          const item = requireItem(state, itemId);
          if (localConveyorMode) {
            setMessage("Demo mode: visual asset generation is available after backend env configuration.");
            setActiveVisualItemId(itemId);
            return;
          }
          setActiveVisualAsset(await api().generateVisualAsset({
            clinicId: clinic.id,
            contentItemId: item.id,
            title: item.title,
            specialty: profile.specialty,
            category: item.category as never,
            tone: state.brandKit.tone,
            clinicName: clinic.name,
            doctorName: profile.name,
            shortCta: item.shortCta || state.brandKit.defaultCta,
            disclaimer: state.brandKit.disclaimer,
            brandColors: { primary: state.brandKit.primaryColor, accent: state.brandKit.accentColor },
            visualStyle: "clean_medical_abstract",
            ...(state.brandKit.logoPath ? { logoPath: state.brandKit.logoPath } : {}),
          }));
          setActiveVisualItemId(itemId);
        });
      },
      async fetchLatestVisualAsset(itemId) {
        await withMutation("loading", async () => {
          const clinic = requireClinic(state);
          if (!localConveyorMode) {
            const latest = (await api().fetchLatestVisualAsset(clinic.id, itemId)) ?? undefined;
            setActiveVisualAsset(latest);
            setActiveVisualItemId(latest ? itemId : undefined);
          }
        });
      },
      async generateVisualCarousel(itemId) {
        await withMutation("generating", async () => {
          if (!config.enableVisualPilot) {
            setMessage("Visual carousel pilot is disabled in the web app.");
            return;
          }
          const clinic = requireClinic(state);
          const profile = requireDoctor(state);
          const item = requireItem(state, itemId);
          const carouselKey = carouselKeyForItem(item);
          if (localConveyorMode) {
            setMessage("Demo mode: carousel generation is available after backend env configuration.");
            return;
          }
          setActiveCarousel(await api().generateVisualCarousel({
            clinicId: clinic.id,
            contentItemId: item.id,
            carouselKey,
            specialty: profile.specialty,
            category: item.category as never,
            tone: state.brandKit.tone,
            clinicName: clinic.name,
            doctorName: profile.name,
            shortCta: item.shortCta || state.brandKit.defaultCta,
            disclaimer: state.brandKit.disclaimer,
            brandColors: { primary: state.brandKit.primaryColor, accent: state.brandKit.accentColor },
            visualStyle: "clean_medical_abstract",
            ...(state.brandKit.logoPath ? { logoPath: state.brandKit.logoPath } : {}),
          }));
        });
      },
      async fetchLatestVisualCarousel(itemId) {
        await withMutation("loading", async () => {
          const clinic = requireClinic(state);
          const item = requireItem(state, itemId);
          if (!localConveyorMode) {
            setActiveCarousel((await api().fetchLatestVisualCarousel(clinic.id, itemId, carouselKeyForItem(item))) ?? undefined);
          }
        });
      },
      async exportVisualAssetPng() {
        await withMutation("generating", async () => {
          if (!activeVisualAsset) {
            setMessage("Generate or load a visual asset before exporting PNG.");
            return;
          }
          if (!localConveyorMode) {
            setActiveVisualAsset(await api().exportVisualAssetPng(activeVisualAsset.assetId));
          }
        });
      },
    }),
    [
      activeCarousel,
      activeVisualAsset,
      activeVisualItemId,
      api,
      config,
      localConveyorMode,
      message,
      mode,
      refresh,
      repository,
      router,
      session,
      state,
      status,
      user,
      withMutation,
    ],
  );

  return <PraxisContext.Provider value={value}>{children}</PraxisContext.Provider>;
}

export function usePraxis() {
  const value = useContext(PraxisContext);
  if (!value) {
    throw new Error("usePraxis must be used within PraxisProvider.");
  }
  return value;
}

function demoState(): PraxisState {
  const clinicId = "56c55f12-5ab3-4831-9e4f-44390f06b531";
  const campaignId = "demo-campaign";
  return {
    clinic: {
      id: clinicId,
      name: doctor.clinic,
      locality: "Koregaon Park",
      city: doctor.city,
      services: ["Grommet consultation", "Hearing tests", "Pediatric ENT"],
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      appointmentUrl: "https://dhwanient.example/book",
    },
    doctor: {
      id: "demo-doctor",
      name: doctor.name,
      qualifications: "MS ENT, Fellowship Otology",
      specialty: doctor.specialty,
    },
    brandKit: {
      ...defaultBrandKit,
      primaryColor: "#12AFC0",
      secondaryColor: "#D7F8F6",
      accentColor: "#C8C43D",
      defaultCta: "Book an ENT consultation",
      disclaimer: "Educational content only. Please consult an ENT specialist for personalised advice.",
    },
    campaign: {
      id: campaignId,
      clinicId,
      title: "30-day pediatric ENT growth campaign",
      goal: "increase appointment enquiries",
      durationDays: 30,
      startDate: "2026-06-29",
      status: "draft",
    },
    items: contentItems.map((item, index) => ({
      id: index === 0 ? "dhwani-grommets" : `demo-item-${index}`,
      clinicId,
      campaignId,
      scheduledDate: dateOnlyAfter(index, new Date("2026-06-29T00:00:00Z")),
      dayOffset: index,
      title: item.title,
      category: item.category.toLowerCase().replace(/[\s-]+/g, "_"),
      status: item.status === "Ready" ? "designed" : item.status.toLowerCase(),
      objective: "Patient education and appointment enquiries",
      keyPoints: ["General patient education", "Doctor approval before publishing"],
      caption: `${item.title} is explained in simple patient-friendly language by ${doctor.clinic}.`,
      reelHook: "",
      reelScript: "",
      shortCta: item.cta,
      disclaimer: "Educational content only. Please consult an ENT specialist for personalised advice.",
      complianceStatus: index === 0 ? "passed" : undefined,
      contentVersionHash: contentHash(item.title),
    })),
    generationLogs: [],
  };
}

function readPreAiState(): PraxisState {
  if (typeof window === "undefined") return demoState();
  const stored = window.localStorage.getItem(preAiStateStorageKey);
  if (!stored) return demoState();
  try {
    const parsed = JSON.parse(stored) as Partial<PraxisState>;
    if (!parsed.brandKit || !Array.isArray(parsed.items)) return demoState();
    return {
      clinic: parsed.clinic,
      doctor: parsed.doctor,
      brandKit: parsed.brandKit,
      campaign: parsed.campaign,
      items: parsed.items,
      generationLogs: Array.isArray(parsed.generationLogs) ? parsed.generationLogs : [],
    };
  } catch {
    return demoState();
  }
}

function patchItem(state: PraxisState, itemId: string, patch: Partial<ContentItem>): PraxisState {
  return {
    ...state,
    items: state.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  };
}

function requireClinic(state: PraxisState) {
  if (!state.clinic?.id) {
    throw new Error("Clinic onboarding is required.");
  }
  return state.clinic;
}

function requireDoctor(state: PraxisState) {
  if (!state.doctor?.name) {
    throw new Error("Doctor onboarding is required.");
  }
  return state.doctor;
}

function requireItem(state: PraxisState, itemId: string) {
  const item = state.items.find((candidate) => candidate.id === itemId) ?? state.items[0];
  if (!item) {
    throw new Error("A content item is required.");
  }
  return item;
}

function carouselKeyForItem(item: ContentItem): VisualCarouselGenerationRequest["carouselKey"] {
  const searchable = [item.title, item.caption, item.objective, ...item.keyPoints].join(" ").toLowerCase();
  if (searchable.includes("wisdom")) {
    return "wisdom_tooth_removal";
  }
  if (searchable.includes("jewellery") || searchable.includes("jewelry") || searchable.includes("nickel")) {
    return "jewellery_skin_reaction";
  }
  if (searchable.includes("preauricular") || searchable.includes("pre auricular")) {
    return "preauricular_sinus_ent";
  }
  return "grommets_child_ent";
}

function handleAuthError(error: AuthError | null) {
  if (error) {
    throw error;
  }
}

function authIdentifierPayload(identifier: string): { email: string } | { phone: string } {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed };
  }
  return { phone: trimmed.replace(/[^\d+]/g, "") };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
