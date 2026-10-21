import { useState, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  selectIsCloudNoteFormattingMode,
  selectPolicyEffectiveSettings,
  selectResolvedNoteFormatting,
  useSettingsStore,
} from "../stores/settingsStore";
import { useUsage } from "./useUsage";
import { usePolicySnapshot } from "./usePolicy";

interface UseNotesOnboardingReturn {
  isComplete: boolean;
  isProUser: boolean;
  isProLoading: boolean;
  isLLMConfigured: boolean;
  complete: () => void;
}

export function useNotesOnboarding(): UseNotesOnboardingReturn {
  const usage = useUsage();
  const isProUser = usage?.hasPaidAccess === true;
  const isProLoading = usage !== null && usage.status !== "success";
  const policyState = usePolicySnapshot();
  const { formattingModel, formattingMode, isCloudFormatting } = useSettingsStore(
    useShallow((settings) => {
      const effective = selectPolicyEffectiveSettings(settings, policyState);
      const formatting = selectResolvedNoteFormatting(effective);
      return {
        formattingModel: formatting.model,
        formattingMode: formatting.mode,
        isCloudFormatting: selectIsCloudNoteFormattingMode(effective),
      };
    })
  );

  const [isComplete, setIsComplete] = useState(
    () => localStorage.getItem("notesOnboardingComplete") === "true"
  );

  const isLLMConfigured =
    isCloudFormatting ||
    formattingMode === "pura" ||
    formattingMode === "mnemo" ||
    (!!formattingModel && formattingMode !== "pura" && formattingMode !== "mnemo");

  const complete = useCallback(() => {
    localStorage.setItem("notesOnboardingComplete", "true");
    setIsComplete(true);
  }, []);

  return { isComplete, isProUser, isProLoading, isLLMConfigured, complete };
}
