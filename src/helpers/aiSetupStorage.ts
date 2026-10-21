import { INFERENCE_SCOPES } from "../config/inferenceScopes";
import { useSettingsStore, type SettingsState } from "../stores/settingsStore";
import type { InferenceMode } from "../types/electron";

export type AiSetupLane = "providers" | "local" | "pura";

const SCOPE_STORE_KEYS = Object.values(INFERENCE_SCOPES).flatMap((scope) =>
  Object.values(scope.storeKeys).filter(Boolean)
) as string[];

const TRANSCRIPTION_KEYS = [
  "transcriptionMode",
  "useLocalWhisper",
  "whisperModel",
  "localTranscriptionProvider",
  "parakeetModel",
  "cohereModel",
  "cloudTranscriptionProvider",
  "cloudTranscriptionModel",
  "cloudTranscriptionBaseUrl",
  "cloudTranscriptionMode",
  "remoteTranscriptionType",
  "remoteTranscriptionUrl",
  "remoteTranscriptionModel",
  "assemblyAiStreaming",
  "showTranscriptionPreview",
  "meetingTranscriptionMode",
  "meetingUseLocalWhisper",
  "meetingWhisperModel",
  "meetingLocalTranscriptionProvider",
  "meetingParakeetModel",
  "meetingCohereModel",
  "meetingCloudTranscriptionProvider",
  "meetingCloudTranscriptionModel",
  "meetingCloudTranscriptionBaseUrl",
  "meetingCloudTranscriptionMode",
  "meetingRemoteTranscriptionType",
  "meetingRemoteTranscriptionUrl",
  "uploadTranscriptionMode",
  "uploadUseLocalWhisper",
  "uploadWhisperModel",
  "uploadLocalTranscriptionProvider",
  "uploadParakeetModel",
  "uploadCohereModel",
  "uploadCloudTranscriptionProvider",
  "uploadCloudTranscriptionModel",
  "uploadCloudTranscriptionBaseUrl",
  "uploadCloudTranscriptionMode",
  "uploadRemoteTranscriptionUrl",
  "uploadRemoteTranscriptionModel",
  "transcriptionModelByProvider",
  "reasoningModelByProvider",
  "useCleanupModel",
  "useDictationAgent",
  "useDictationTranslation",
  "voiceAgentScreenContext",
  "useDictationAgentVisionModel",
  "translationSourceLanguage",
  "translationTargetLanguage",
  "translationTargets",
  "enterpriseSetupMode",
  "enterpriseTranscriptionSetupMode",
] as const;

export const AI_SETUP_LOCAL_STORAGE_KEYS: readonly string[] = [
  ...new Set([...TRANSCRIPTION_KEYS, ...SCOPE_STORE_KEYS]),
];

function readBoolean(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key);
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function readString(key: string, fallback: string): string {
  const v = localStorage.getItem(key);
  return v ?? fallback;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readInferenceMode(key: string, fallback: InferenceMode): InferenceMode {
  const v = readString(key, fallback);
  if (
    v === "mnemo" ||
    v === "providers" ||
    v === "local" ||
    v === "self-hosted" ||
    v === "enterprise"
  ) {
    return v;
  }
  return fallback;
}

export function captureAiSetupLocalStorage(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (const key of AI_SETUP_LOCAL_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

export function applyAiSetupLocalStorage(snapshot: Record<string, string>): void {
  for (const key of AI_SETUP_LOCAL_STORAGE_KEYS) {
    const value = snapshot[key];
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
  refreshAiSettingsFromLocalStorage();
}

export function refreshAiSettingsFromLocalStorage(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  const scopePatch: Partial<SettingsState> = {};
  for (const scope of Object.values(INFERENCE_SCOPES)) {
    for (const storeKey of Object.values(scope.storeKeys)) {
      if (!storeKey) continue;
      const key = storeKey as keyof SettingsState & string;
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        (scopePatch as Record<string, unknown>)[key] = raw;
      }
    }
  }

  useSettingsStore.setState({
    ...scopePatch,
    transcriptionMode: readInferenceMode("transcriptionMode", "providers"),
    useLocalWhisper: readBoolean("useLocalWhisper", false),
    whisperModel: readString("whisperModel", "base"),
    localTranscriptionProvider: readString("localTranscriptionProvider", "whisper") as
      | "whisper"
      | "nvidia"
      | "cohere",
    parakeetModel: readString("parakeetModel", ""),
    cohereModel: readString("cohereModel", ""),
    cloudTranscriptionProvider: readString("cloudTranscriptionProvider", "openai"),
    cloudTranscriptionModel: readString("cloudTranscriptionModel", ""),
    cloudTranscriptionBaseUrl: readString("cloudTranscriptionBaseUrl", ""),
    cloudTranscriptionMode: readString("cloudTranscriptionMode", "byok"),
    remoteTranscriptionType:
      readString("remoteTranscriptionType", "lan") === "openai-compatible"
        ? "openai-compatible"
        : "lan",
    remoteTranscriptionUrl: readString("remoteTranscriptionUrl", ""),
    remoteTranscriptionModel: readString("remoteTranscriptionModel", ""),
    assemblyAiStreaming: readBoolean("assemblyAiStreaming", true),
    showTranscriptionPreview: readBoolean("showTranscriptionPreview", false),
    meetingTranscriptionMode: readInferenceMode("meetingTranscriptionMode", "providers"),
    meetingUseLocalWhisper: readBoolean("meetingUseLocalWhisper", false),
    meetingWhisperModel: readString("meetingWhisperModel", ""),
    meetingLocalTranscriptionProvider: readString(
      "meetingLocalTranscriptionProvider",
      "whisper"
    ) as "whisper" | "nvidia" | "cohere",
    meetingParakeetModel: readString("meetingParakeetModel", ""),
    meetingCohereModel: readString("meetingCohereModel", ""),
    meetingCloudTranscriptionProvider: readString("meetingCloudTranscriptionProvider", ""),
    meetingCloudTranscriptionModel: readString("meetingCloudTranscriptionModel", ""),
    meetingCloudTranscriptionBaseUrl: readString("meetingCloudTranscriptionBaseUrl", ""),
    meetingCloudTranscriptionMode: readString("meetingCloudTranscriptionMode", ""),
    meetingRemoteTranscriptionType:
      readString("meetingRemoteTranscriptionType", "lan") === "openai-compatible"
        ? "openai-compatible"
        : "lan",
    meetingRemoteTranscriptionUrl: readString("meetingRemoteTranscriptionUrl", ""),
    uploadTranscriptionMode: readInferenceMode("uploadTranscriptionMode", "providers"),
    uploadUseLocalWhisper: readBoolean("uploadUseLocalWhisper", false),
    uploadWhisperModel: readString("uploadWhisperModel", ""),
    uploadLocalTranscriptionProvider: readString(
      "uploadLocalTranscriptionProvider",
      "whisper"
    ) as "whisper" | "nvidia" | "cohere",
    uploadParakeetModel: readString("uploadParakeetModel", ""),
    uploadCohereModel: readString("uploadCohereModel", ""),
    uploadCloudTranscriptionProvider: readString("uploadCloudTranscriptionProvider", ""),
    uploadCloudTranscriptionModel: readString("uploadCloudTranscriptionModel", ""),
    uploadCloudTranscriptionBaseUrl: readString("uploadCloudTranscriptionBaseUrl", ""),
    uploadCloudTranscriptionMode: readString("uploadCloudTranscriptionMode", ""),
    uploadRemoteTranscriptionUrl: readString("uploadRemoteTranscriptionUrl", ""),
    uploadRemoteTranscriptionModel: readString("uploadRemoteTranscriptionModel", ""),
    transcriptionModelByProvider: readJson("transcriptionModelByProvider", {}),
    reasoningModelByProvider: readJson("reasoningModelByProvider", {}),
    useCleanupModel: readBoolean("useCleanupModel", true),
    useDictationAgent: readBoolean("useDictationAgent", true),
    useDictationTranslation: readBoolean("useDictationTranslation", false),
    voiceAgentScreenContext: readBoolean("voiceAgentScreenContext", false),
    useDictationAgentVisionModel: readBoolean("useDictationAgentVisionModel", false),
    translationSourceLanguage: readString("translationSourceLanguage", "auto"),
    translationTargetLanguage: readString("translationTargetLanguage", ""),
    translationTargets: readJson("translationTargets", []),
    enterpriseSetupMode: (() => {
      const v = readString("enterpriseSetupMode", "auto");
      return v === "managed" || v === "manual" || v === "auto" ? v : "auto";
    })(),
    enterpriseTranscriptionSetupMode: (() => {
      const v = readString("enterpriseTranscriptionSetupMode", "auto");
      return v === "managed" || v === "manual" || v === "auto" ? v : "auto";
    })(),
    cleanupMode: readInferenceMode("cleanupMode", "providers"),
    cleanupProvider: readString("cleanupProvider", "openai"),
    cleanupModel: readString("cleanupModel", ""),
    cleanupCloudMode: readString("cleanupCloudMode", "byok"),
    cleanupCloudBaseUrl: readString("cleanupCloudBaseUrl", ""),
    cleanupRemoteUrl: readString("cleanupRemoteUrl", ""),
  });
}

const LANE_INFERENCE_MODE: Record<AiSetupLane, InferenceMode> = {
  providers: "providers",
  local: "local",
  pura: "providers",
};

export function applySetupLaneToInferenceModes(lane: AiSetupLane): void {
  const mode = LANE_INFERENCE_MODE[lane];
  const state = useSettingsStore.getState();
  state.setTranscriptionMode(mode);
  state.setMeetingTranscriptionMode(mode);
  state.setUploadTranscriptionMode(mode);
  state.setCleanupMode(mode);
  state.setNoteFormattingMode(mode);
  state.setTranslationMode(mode);
  state.setDictationAgentMode(mode);
  state.setChatAgentMode(mode);
  if (lane === "local") {
    state.setUseLocalWhisper(true);
    state.setMeetingUseLocalWhisper(true);
    state.setUploadUseLocalWhisper(true);
  }
  if (lane === "providers" || lane === "pura") {
    state.setUseLocalWhisper(false);
    state.setMeetingUseLocalWhisper(false);
    state.setUploadUseLocalWhisper(false);
    if (lane === "pura") {
      state.setCloudTranscriptionMode("byok");
      state.setCleanupCloudMode("byok");
    }
  }
}
