import { useEffect } from "react";
import type { AiSetupLane } from "../helpers/aiSetupStorage";
import { transcriptionModeForSetupLane } from "../helpers/aiSetupLanePolicy";
import type { InferenceMode } from "../types/electron";

/** Keeps per-scope transcription mode aligned with the active AI setup backend. */
export function useAlignTranscriptionWithSetupLane(
  lane: AiSetupLane | null,
  mode: InferenceMode,
  setMode: (mode: InferenceMode) => void,
  setUseLocalWhisper: (value: boolean) => void
) {
  useEffect(() => {
    if (!lane) return;
    const want = transcriptionModeForSetupLane(lane);
    if (mode === want) return;
    setMode(want);
    setUseLocalWhisper(want === "local");
  }, [lane, mode, setMode, setUseLocalWhisper]);
}
