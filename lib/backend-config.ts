import backendConfigJson from "../data/backend-config.json";

export type BackendPageType = "default" | "ranking" | "event" | "custom" | "ssg";

export type TournamentConfigEntry = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  url?: string;
  pageType?: BackendPageType;
  prizePool?: string;
  startsAt?: string;
  seeds?: string[];
};

export type BackendConfig = {
  appsScript: {
    baseUrl: string;
    actions: Record<string, string>;
  };
  pages: {
    mc?: {
      defaultMode?: "rsg" | "ranked" | "states";
      rsgDefaultCategory?: "1.16" | "1.16 SSG";
    };
    tournaments?: {
      defaultType?: BackendPageType;
      entries?: TournamentConfigEntry[];
    };
  };
};

const defaultConfig = backendConfigJson as BackendConfig;

export function getBackendConfig(): BackendConfig {
  const baseUrlOverride = (process.env.GAS_BASE_URL ?? "").trim();
  return {
    ...defaultConfig,
    appsScript: {
      ...defaultConfig.appsScript,
      baseUrl: baseUrlOverride || String(defaultConfig.appsScript?.baseUrl ?? "").trim(),
    },
  };
}

export function getAction(name: string): string {
  const cfg = getBackendConfig();
  return String(cfg.appsScript.actions?.[name] ?? "").trim();
}

export function getTournamentConfigEntries(): TournamentConfigEntry[] {
  const cfg = getBackendConfig();
  const entries = cfg.pages?.tournaments?.entries ?? [];
  return Array.isArray(entries) ? entries : [];
}

export function getTournamentDefaultType(): BackendPageType {
  const cfg = getBackendConfig();
  return cfg.pages?.tournaments?.defaultType ?? "default";
}
