import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultBrandKit,
  defaultDisclaimer,
  type AiGenerationLog,
  type BrandKit,
  type ContentCampaign,
  type ContentItem,
  type DoctorProfile,
  type PraxisState,
} from "./praxis-models.ts";

type Row = Record<string, unknown>;

export class SupabasePraxisRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async load(): Promise<PraxisState> {
    const { data: userData } = await this.client.auth.getUser();
    const user = userData.user;
    if (!user) {
      return emptyState();
    }

    const clinicRows = await rows(
      this.client.from("clinics").select().eq("owner_user_id", user.id).order("created_at").limit(1),
    );
    if (clinicRows.length === 0) {
      return emptyState();
    }

    const clinicId = text(clinicRows[0], "id");
    const serviceRows = await rows(
      this.client.from("clinic_services").select().eq("clinic_id", clinicId).order("name"),
    );
    const doctorRow = await maybeSingle(
      this.client.from("doctor_profiles").select("*, specialties(name)").eq("clinic_id", clinicId),
    );
    const brandRow = await maybeSingle(this.client.from("brand_kits").select().eq("clinic_id", clinicId));
    const campaignRows = await rows(
      this.client
        .from("content_campaigns")
        .select()
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(1),
    );
    const campaign = campaignRows[0] ? campaignFromRow(campaignRows[0]) : undefined;
    const itemRows = campaign
      ? await rows(this.client.from("content_items").select().eq("campaign_id", campaign.id).order("day_offset"))
      : [];
    const logRows = await rows(
      this.client
        .from("ai_generation_logs")
        .select()
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(20),
    );

    return {
      clinic: {
        id: clinicId,
        name: text(clinicRows[0], "name"),
        locality: text(clinicRows[0], "locality"),
        city: text(clinicRows[0], "city"),
        services: serviceRows.map((row) => text(row, "name")).filter(Boolean),
        phone: text(clinicRows[0], "phone"),
        whatsapp: optionalText(clinicRows[0], "whatsapp"),
        appointmentUrl: optionalText(clinicRows[0], "appointment_url"),
      },
      doctor: doctorRow ? doctorFromRow(doctorRow) : undefined,
      brandKit: brandRow ? brandKitFromRow(brandRow) : defaultBrandKit,
      campaign,
      items: itemRows.map(contentItemFromRow),
      generationLogs: logRows.map(generationLogFromRow),
    };
  }

  async saveOnboarding(input: {
    state: PraxisState;
    doctorName: string;
    qualifications: string;
    specialty: string;
    clinicName: string;
    locality: string;
    city: string;
    services: string[];
    phone: string;
  }): Promise<PraxisState> {
    const { data: userData } = await this.client.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      throw new Error("Supabase user session is required for onboarding.");
    }
    const clinicPayload = {
      ...(input.state.clinic?.id ? { id: input.state.clinic.id } : {}),
      owner_user_id: userId,
      name: input.clinicName,
      locality: input.locality,
      city: input.city,
      phone: input.phone,
      whatsapp: input.phone,
    };
    const clinicRow = await single(this.client.from("clinics").upsert(clinicPayload).select());
    const clinicId = text(clinicRow, "id");
    const specialtyId = await this.specialtyIdFor(input.specialty);
    await single(
      this.client
        .from("doctor_profiles")
        .upsert(
          {
            ...(input.state.doctor?.id ? { id: input.state.doctor.id } : {}),
            clinic_id: clinicId,
            user_id: userId,
            doctor_name: input.doctorName,
            qualifications: input.qualifications,
            specialty_id: specialtyId,
            onboarding_completed_at: new Date().toISOString(),
          },
          { onConflict: "clinic_id,user_id" },
        )
        .select(),
    );

    await this.client.from("clinic_services").delete().eq("clinic_id", clinicId);
    if (input.services.length > 0) {
      await this.client
        .from("clinic_services")
        .insert(input.services.map((name) => ({ clinic_id: clinicId, name })));
    }

    return this.saveBrandKit({
      state: {
        ...input.state,
        clinic: {
          id: clinicId,
          name: input.clinicName,
          locality: input.locality,
          city: input.city,
          services: input.services,
          phone: input.phone,
          whatsapp: input.phone,
        },
        doctor: {
          id: input.state.doctor?.id ?? "",
          name: input.doctorName,
          qualifications: input.qualifications,
          specialty: input.specialty,
        },
      },
      brandKit: input.state.brandKit,
    });
  }

  async saveBrandKit(input: { state: PraxisState; brandKit: BrandKit }): Promise<PraxisState> {
    const clinic = input.state.clinic;
    if (!clinic?.id) {
      return { ...input.state, brandKit: input.brandKit };
    }
    const doctor = input.state.doctor;
    const row = await single(
      this.client
        .from("brand_kits")
        .upsert(
          {
            clinic_id: clinic.id,
            clinic_display_name: clinic.name,
            doctor_display_name: doctor?.name ?? clinic.name,
            qualifications: doctor?.qualifications ?? "",
            locations: [{ locality: clinic.locality, city: clinic.city }],
            phone: clinic.phone,
            whatsapp: clinic.whatsapp ?? clinic.phone,
            appointment_url: clinic.appointmentUrl,
            primary_color: input.brandKit.primaryColor,
            secondary_color: input.brandKit.secondaryColor,
            accent_color: input.brandKit.accentColor,
            typography_style: "clean",
            tone: input.brandKit.tone,
            default_cta: input.brandKit.defaultCta,
            disclaimer_text: input.brandKit.disclaimer,
            logo_path: input.brandKit.logoPath,
          },
          { onConflict: "clinic_id" },
        )
        .select(),
    );
    return { ...input.state, brandKit: brandKitFromRow(row) };
  }

  async uploadLogo(input: { state: PraxisState; file: File }): Promise<PraxisState> {
    const clinicId = input.state.clinic?.id;
    if (!clinicId) {
      return input.state;
    }
    const extension = input.file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${clinicId}/logo.${extension}`;
    const { error } = await this.client.storage
      .from("clinic-logos")
      .upload(path, input.file, { upsert: true, contentType: input.file.type });
    if (error) {
      throw error;
    }
    return this.saveBrandKit({
      state: input.state,
      brandKit: { ...input.state.brandKit, logoPath: path },
    });
  }

  async saveCampaignPackage(input: {
    state: PraxisState;
    campaign: ContentCampaign;
    items: ContentItem[];
  }): Promise<PraxisState> {
    const clinicId = input.state.clinic?.id;
    if (!clinicId) {
      return { ...input.state, campaign: input.campaign, items: input.items };
    }
    const campaignRow = await single(
      this.client
        .from("content_campaigns")
        .upsert({
          id: input.campaign.id,
          clinic_id: clinicId,
          title: input.campaign.title,
          goal: input.campaign.goal,
          duration_days: input.campaign.durationDays,
          start_date: input.campaign.startDate,
          status: input.campaign.status,
        })
        .select(),
    );
    const campaign = campaignFromRow(campaignRow);
    await this.client.from("content_items").delete().eq("campaign_id", campaign.id);
    if (input.items.length > 0) {
      await this.client.from("content_items").insert(
        input.items.map((item) => ({
          id: item.id,
          clinic_id: clinicId,
          campaign_id: campaign.id,
          scheduled_date: item.scheduledDate,
          day_offset: item.dayOffset,
          title: item.title,
          category: item.category,
          status: item.status,
          objective: item.objective,
          key_points: item.keyPoints,
          caption: item.caption,
          reel_hook: item.reelHook,
          reel_script: item.reelScript,
          short_cta: item.shortCta,
          disclaimer_text: item.disclaimer,
          compliance_review_status: item.complianceStatus,
          content_version_hash: item.contentVersionHash,
        })),
      );
    }
    return { ...input.state, campaign, items: input.items };
  }

  async updateContentItem(input: {
    state: PraxisState;
    itemId: string;
    patch: Partial<ContentItem>;
  }): Promise<PraxisState> {
    const payload: Row = {};
    if (input.patch.caption !== undefined) payload.caption = input.patch.caption;
    if (input.patch.reelHook !== undefined) payload.reel_hook = input.patch.reelHook;
    if (input.patch.reelScript !== undefined) payload.reel_script = input.patch.reelScript;
    if (input.patch.shortCta !== undefined) payload.short_cta = input.patch.shortCta;
    if (input.patch.complianceStatus !== undefined) payload.compliance_review_status = input.patch.complianceStatus;
    if (input.patch.contentVersionHash !== undefined) payload.content_version_hash = input.patch.contentVersionHash;
    payload.status = input.patch.status ?? "drafted";
    payload.user_edited_at = new Date().toISOString();

    await this.client.from("content_items").update(payload).eq("id", input.itemId);
    return {
      ...input.state,
      items: input.state.items.map((item) =>
        item.id === input.itemId ? { ...item, ...input.patch, status: String(payload.status) } : item,
      ),
    };
  }

  private async specialtyIdFor(specialty: string): Promise<string | null> {
    const canonical = canonicalSpecialtyName(specialty);
    if (!canonical) {
      return null;
    }
    const result = await this.client.from("specialties").select("id").ilike("name", canonical).limit(1);
    const data = "data" in result ? result.data : [];
    const rows = Array.isArray(data) ? (data as Row[]) : [];
    return rows[0] ? optionalText(rows[0], "id") ?? null : null;
  }
}

export function emptyState(): PraxisState {
  return { brandKit: defaultBrandKit, items: [], generationLogs: [] };
}

export function brandKitFromRow(row: Row): BrandKit {
  return {
    primaryColor: text(row, "primary_color") || defaultBrandKit.primaryColor,
    secondaryColor: text(row, "secondary_color") || defaultBrandKit.secondaryColor,
    accentColor: text(row, "accent_color") || defaultBrandKit.accentColor,
    tone: (text(row, "tone") || defaultBrandKit.tone) as BrandKit["tone"],
    defaultCta: text(row, "default_cta") || defaultBrandKit.defaultCta,
    disclaimer: text(row, "disclaimer_text") || defaultDisclaimer,
    logoPath: optionalText(row, "logo_path"),
  };
}

export function contentItemFromRow(row: Row): ContentItem {
  return {
    id: text(row, "id"),
    clinicId: text(row, "clinic_id"),
    campaignId: text(row, "campaign_id"),
    scheduledDate: text(row, "scheduled_date"),
    dayOffset: number(row, "day_offset"),
    title: text(row, "title"),
    category: text(row, "category"),
    status: text(row, "status") || "idea",
    objective: text(row, "objective"),
    keyPoints: stringArray(row.key_points),
    caption: text(row, "caption"),
    reelHook: text(row, "reel_hook"),
    reelScript: text(row, "reel_script"),
    shortCta: text(row, "short_cta"),
    disclaimer: text(row, "disclaimer_text"),
    complianceStatus: optionalText(row, "compliance_review_status"),
    contentVersionHash: optionalText(row, "content_version_hash"),
  };
}

export function campaignFromRow(row: Row): ContentCampaign {
  return {
    id: text(row, "id"),
    clinicId: text(row, "clinic_id"),
    title: text(row, "title"),
    goal: text(row, "goal"),
    durationDays: number(row, "duration_days") || 30,
    startDate: text(row, "start_date") || new Date().toISOString().slice(0, 10),
    status: (text(row, "status") || "draft") as ContentCampaign["status"],
  };
}

export function doctorFromRow(row: Row): DoctorProfile {
  const specialty = row.specialties;
  const specialtyName = specialty && typeof specialty === "object" ? text(specialty as Row, "name") : "";
  return {
    id: text(row, "id"),
    name: text(row, "doctor_name"),
    qualifications: text(row, "qualifications"),
    specialty: specialtyName || "Dermatology",
  };
}

export function generationLogFromRow(row: Row): AiGenerationLog {
  return {
    id: text(row, "id"),
    generationType: text(row, "generation_type"),
    provider: text(row, "provider"),
    model: text(row, "model"),
    status: text(row, "status"),
    createdAt: text(row, "created_at"),
    latencyMs: number(row, "latency_ms"),
  };
}

export function createCampaignFromPlan(input: {
  clinicId: string;
  title: string;
  goal: string;
  durationDays: number;
  startDate: string;
}): ContentCampaign {
  return {
    id: newId(),
    clinicId: input.clinicId,
    title: input.title,
    goal: input.goal,
    durationDays: input.durationDays,
    startDate: input.startDate,
    status: "draft",
  };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `campaign-${Date.now()}`;
}

export function canonicalSpecialtyName(specialty: string): string {
  switch (specialty.trim().toLowerCase()) {
    case "dentist":
    case "dentistry":
      return "Dental";
    case "gynaecology":
    case "gynecology":
    case "ivf":
      return "Gynecology and IVF";
    default:
      return specialty.trim();
  }
}

async function rows(query: PromiseLike<{ data: unknown; error?: unknown }>): Promise<Row[]> {
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return Array.isArray(data) ? (data as Row[]) : [];
}

async function maybeSingle(query: PromiseLike<{ data: unknown; error?: unknown }>): Promise<Row | undefined> {
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  if (Array.isArray(data)) {
    return data[0] as Row | undefined;
  }
  return data && typeof data === "object" ? (data as Row) : undefined;
}

async function single(query: PromiseLike<{ data: unknown; error?: unknown }>): Promise<Row> {
  const row = await maybeSingle(query);
  if (!row) {
    throw new Error("Expected Supabase mutation to return a row.");
  }
  return row;
}

function text(row: Row, key: string): string {
  const value = row[key];
  return value === null || value === undefined ? "" : String(value);
}

function optionalText(row: Row, key: string): string | undefined {
  const value = text(row, key);
  return value ? value : undefined;
}

function number(row: Row, key: string): number {
  const raw = row[key];
  return typeof raw === "number" ? raw : Number.parseInt(String(raw ?? 0), 10) || 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}
