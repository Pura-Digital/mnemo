import { isMnemoStandaloneProduct } from "../config/mnemoProduct";
import { isPuraConnectConfigured } from "../config/puraConnect";
import { readPuraConnectionFromStore } from "../services/pura/puraInferenceClient";
import { requestSignIn } from "./requestSignIn";

/**
 * Ensures the user can run hosted Pura LLM inference: mnemo account on cloud,
 * or an active Pura Connect session on standalone.
 */
export async function ensurePuraLlmAccess(locale: string = "it"): Promise<boolean> {
  if (!isMnemoStandaloneProduct()) {
    const { getSettings } = await import("../stores/settingsStore");
    if (!getSettings().isSignedIn) {
      requestSignIn();
      return false;
    }
    return true;
  }
  if (!isPuraConnectConfigured()) return false;
  const state = await readPuraConnectionFromStore();
  if (state.connected) return true;
  if (!window.electronAPI?.puraStartConnection) return false;
  const result = await window.electronAPI.puraStartConnection(locale);
  return result.success;
}
