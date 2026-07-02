export type WebConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  enableVisualPilot: boolean;
  preAiConveyorMode: boolean;
  isBackendConfigured: boolean;
  demoMode: boolean;
};

export function readWebConfig(env: Record<string, string | undefined> = process.env): WebConfig {
  const supabaseUrl = trimTrailingSlash(env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const apiBaseUrl = trimTrailingSlash(env.NEXT_PUBLIC_API_BASE_URL);
  const enableVisualPilot = env.NEXT_PUBLIC_ENABLE_VISUAL_PILOT === "true";
  const preAiConveyorMode = env.NEXT_PUBLIC_PRE_AI_CONVEYOR !== "false";
  const isBackendConfigured = Boolean(supabaseUrl && supabaseAnonKey && apiBaseUrl);

  return {
    supabaseUrl,
    supabaseAnonKey,
    apiBaseUrl,
    enableVisualPilot,
    preAiConveyorMode,
    isBackendConfigured,
    demoMode: !isBackendConfigured,
  };
}

export function getWebConfig(): WebConfig {
  return readWebConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_ENABLE_VISUAL_PILOT: process.env.NEXT_PUBLIC_ENABLE_VISUAL_PILOT,
    NEXT_PUBLIC_PRE_AI_CONVEYOR: process.env.NEXT_PUBLIC_PRE_AI_CONVEYOR,
  });
}

function trimTrailingSlash(value?: string): string {
  return value?.trim().replace(/\/+$/, "") ?? "";
}
