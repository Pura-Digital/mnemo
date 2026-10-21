/**
 * mnemo desktop is a standalone app: no sign-in, hosted cloud account, or
 * subscription upsell surfaces. Backend identifiers stay legacy-compatible (mnemo).
 */
export function isMnemoStandaloneProduct(): boolean {
  return true;
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
  return modes.filter((mode) => !HIDDEN_INFERENCE_MODE_IDS.has(mode.id));
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
