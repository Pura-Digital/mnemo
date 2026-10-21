import { isPuraConnectConfigured } from "./puraConnect";

/**
 * mnemo desktop is a standalone app: no sign-in, hosted cloud account, or
 * subscription upsell surfaces. Backend identifiers stay legacy-compatible (mnemo).
 */
export function isMnemoStandaloneProduct(): boolean {
  return true;
}

/** Hosted Pura LLM setup is offered on standalone when OAuth client credentials are present. */
export function isPuraLlmOfferedOnStandalone(): boolean {
  return isMnemoStandaloneProduct() && isPuraConnectConfigured();
}

/** In-app chat, voice assistant, wake-word agent, and local semantic RAG. */
export function isConversationalAgentEnabled(): boolean {
  return !isMnemoStandaloneProduct();
}

/** ArchivEye OAuth + note push (standalone mnemo knowledge lives in ArchivEye). */
export function isArchiveyeIntegrationEnabled(): boolean {
  return isMnemoStandaloneProduct();
}

export function isSemanticSearchEnabled(): boolean {
  return isConversationalAgentEnabled();
}

const HIDDEN_INFERENCE_MODE_IDS = new Set(["pura"]);

export function filterInferenceModeOptions<T extends { id: string }>(modes: T[]): T[] {
  if (!isMnemoStandaloneProduct()) return modes;
  if (isPuraConnectConfigured()) return modes;
  // Keep Pura LLM visible on standalone; InferenceConfigEditor marks it disabled when OAuth is not set up.
  return modes.filter(
    (mode) => mode.id === "pura" || !HIDDEN_INFERENCE_MODE_IDS.has(mode.id)
  );
}

/** Whether the Pura LLM inference mode can be selected (account on cloud app, OAuth on standalone). */
export function isPuraInferenceModeSelectable(isSignedIn: boolean): boolean {
  if (!isMnemoStandaloneProduct()) return isSignedIn;
  return isPuraConnectConfigured();
}

export const MNEMO_HIDDEN_SETTINGS_SECTIONS = new Set([
  "account",
  "plansBilling",
  "workspace",
  "speechToText",
  "llms",
  "puraLlm",
]);

/** LLM settings tabs hidden on mnemo (cleanup + note formatting only). */
export const MNEMO_HIDDEN_LLM_TABS = new Set([
  "dictationAgent",
  "chatIntelligence",
]);
