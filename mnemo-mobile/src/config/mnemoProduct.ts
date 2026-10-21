/**
 * mnemo mobile: no sign-in, subscription, or hosted-account product surfaces.
 */
export function isMnemoStandaloneProduct(): boolean {
  return true;
}

export function isConversationalAgentEnabled(): boolean {
  return !isMnemoStandaloneProduct();
}

export function isArchiveyeIntegrationEnabled(): boolean {
  return isMnemoStandaloneProduct();
}

const HIDDEN_INFERENCE_MODES = new Set(['pura']);

export function filterInferenceModes<T extends { mode: string }>(modes: T[]): T[] {
  if (!isMnemoStandaloneProduct()) return modes;
  return modes.filter((entry) => !HIDDEN_INFERENCE_MODES.has(entry.mode));
}

export function runStandaloneSuperwallBypass({
  feature,
  onAccessGrantedWithoutPurchase,
}: {
  feature?: () => void;
  onAccessGrantedWithoutPurchase?: () => void;
}): true {
  feature?.();
  onAccessGrantedWithoutPurchase?.();
  return true;
}
