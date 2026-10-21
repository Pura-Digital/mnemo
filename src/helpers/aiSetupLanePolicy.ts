import type { AiSetupLane } from "./aiSetupStorage";
import type { InferenceMode } from "../types/electron";

const PURA_INFERENCE_MODE = "pura" as InferenceMode;

const LANE_TRANSCRIPTION_MODE: Record<AiSetupLane, InferenceMode> = {
  providers: "providers",
  local: "local",
  pura: PURA_INFERENCE_MODE,
};

export function isAiSetupLaneLocked(lane: AiSetupLane | null | undefined): boolean {
  return lane != null;
}

export function transcriptionModeForSetupLane(lane: AiSetupLane): InferenceMode {
  return LANE_TRANSCRIPTION_MODE[lane];
}

/** Which TranscriptionModelPicker branch to show when the setup lane owns the backend choice. */
export function transcriptionPickerModeForSetupLane(
  lane: AiSetupLane
): "cloud" | "local" {
  return lane === "local" ? "local" : "cloud";
}

export function resolveTranscriptionUiMode(
  lane: AiSetupLane | null | undefined,
  effectiveMode: InferenceMode
): InferenceMode {
  if (!lane) return effectiveMode;
  return transcriptionModeForSetupLane(lane);
}

export function llmAllowedModesForSetupLane(
  lane: AiSetupLane | null | undefined
): InferenceMode[] | undefined {
  if (!lane) return undefined;
  if (lane === "local") return ["local"];
  if (lane === "pura") return [PURA_INFERENCE_MODE];
  return ["providers", "self-hosted"];
}

export function mergeAllowedInferenceModes(
  lane: AiSetupLane | null | undefined,
  explicit?: InferenceMode[]
): InferenceMode[] | undefined {
  const fromLane = llmAllowedModesForSetupLane(lane);
  if (!fromLane) return explicit;
  if (!explicit) return fromLane;
  return explicit.filter((mode) => fromLane.includes(mode));
}

/** When non-null, the setup lane fixes the LLM mode (no in-scope Cloud/Local toggle). */
export function llmModeForcedBySetupLane(lane: AiSetupLane | null | undefined): InferenceMode | null {
  if (!lane) return null;
  if (lane === "local") return "local";
  if (lane === "pura") return PURA_INFERENCE_MODE;
  return null;
}

export function isHostedPuraInferenceMode(mode: InferenceMode | string | null | undefined): boolean {
  return mode === "pura" || mode === "mnemo";
}

/** Pura LLM chooses models server-side — no BYOK picker in the UI. */
export function showsTranscriptionModelPicker(
  lane: AiSetupLane | null | undefined,
  uiMode: InferenceMode
): boolean {
  if (lane === "pura" || isHostedPuraInferenceMode(uiMode)) return false;
  return uiMode === "providers" || uiMode === "local" || uiMode === "self-hosted";
}

export function showsLlmModelPicker(
  lane: AiSetupLane | null | undefined,
  uiMode: InferenceMode
): boolean {
  if (lane === "pura" || isHostedPuraInferenceMode(uiMode)) return false;
  return uiMode === "providers" || uiMode === "local" || uiMode === "self-hosted";
}
