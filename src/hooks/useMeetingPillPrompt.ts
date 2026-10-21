import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import type { MeetingNotificationData } from "../types/electron";
import { getMeetingNotificationPresentation } from "../components/meetingNotificationModel";
import { MEETING_PROMPT_TIMING } from "../helpers/voicePillPresentation";

// arming: the pill is unchanged while the native window widens under it.
// expanding: the pill grows on the listening curve, content still hidden.
// open: content visible, countdown running. fading → collapsing run it back.
export type MeetingPillPromptPhase = "arming" | "expanding" | "open" | "fading" | "collapsing";

// A resumed countdown keeps some runway so the pill cannot fold away right as
// the pointer leaves it.
const MIN_RESUME_MS = 2000;

interface ActivePrompt {
  data: MeetingNotificationData;
  settled: boolean;
}

export interface MeetingPillPrompt {
  phase: MeetingPillPromptPhase | null;
  title: string;
  body: string;
  actionLabel: string;
  /** The pill renders the wide footprint. */
  expanded: boolean;
  contentVisible: boolean;
  /** The native window must hold the prompt width. */
  windowActive: boolean;
  onAction: () => void;
  onDismiss: () => void;
}

/**
 * Hosts meeting prompts inside the dictation pill: the pill grows into a wide
 * pill exactly like the listening entrance, counts down (paused on hover) and
 * folds back. Every exit reports exactly one response, so the engine never
 * keeps a detection the user can no longer see.
 */
export function useMeetingPillPrompt({
  t,
  paused,
  isRecording,
}: {
  t: TFunction;
  paused: boolean;
  isRecording: boolean;
}): MeetingPillPrompt {
  const [prompt, setPrompt] = useState<ActivePrompt | null>(null);
  const [phase, setPhase] = useState<MeetingPillPromptPhase | null>(null);
  const [revision, setRevision] = useState(0);
  const promptRef = useRef<ActivePrompt | null>(null);
  const phaseRef = useRef<MeetingPillPromptPhase | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const remainingRef = useRef(0);

  useLayoutEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    timersRef.current.push(setTimeout(callback, delayMs));
  }, []);

  const settle = useCallback((active: ActivePrompt | null, action: string | null) => {
    if (!active || active.settled) return;
    active.settled = true;
    if (action) {
      void window.electronAPI?.meetingNotificationRespond?.(active.data.detectionId, action);
    }
  }, []);

  const close = useCallback(
    (action: string | null) => {
      const active = promptRef.current;
      if (!active || active.settled) return;
      settle(active, action);
      clearTimers();
      const finish = () => {
        if (promptRef.current !== active) return;
        promptRef.current = null;
        setPrompt(null);
        setPhase(null);
      };
      if (phaseRef.current === "arming") {
        finish();
        return;
      }
      setPhase("fading");
      schedule(() => {
        setPhase("collapsing");
        schedule(finish, MEETING_PROMPT_TIMING.expansionMs);
      }, MEETING_PROMPT_TIMING.contentFadeMs);
    },
    [clearTimers, schedule, settle]
  );

  useEffect(() => {
    const show = (data: MeetingNotificationData) => {
      if (!data?.pillDurationMs) return;
      // The main process replaced this prompt itself; it needs no response.
      settle(promptRef.current, null);
      clearTimers();
      const next: ActivePrompt = { data, settled: false };
      const alreadyWide = phaseRef.current === "expanding" || phaseRef.current === "open";
      promptRef.current = next;
      remainingRef.current = data.pillDurationMs;
      setPrompt(next);
      setRevision((value) => value + 1);
      if (alreadyWide) {
        setPhase("open");
        return;
      }
      setPhase("arming");
      schedule(() => {
        setPhase("expanding");
        schedule(
          () => setPhase("open"),
          MEETING_PROMPT_TIMING.expansionMs + MEETING_PROMPT_TIMING.contentDelayMs
        );
      }, MEETING_PROMPT_TIMING.windowLeadMs);
    };

    const unsubscribeData = window.electronAPI?.onMeetingNotificationData?.(show);
    const unsubscribeDismissed = window.electronAPI?.onMeetingNotificationDismissed?.(
      (detectionId) => {
        if (promptRef.current?.data.detectionId === detectionId) close(null);
      }
    );
    return () => {
      unsubscribeData?.();
      unsubscribeDismissed?.();
      clearTimers();
    };
  }, [clearTimers, close, schedule, settle]);

  useEffect(() => {
    if (phase !== "open" || paused) return undefined;
    const startedAt = Date.now();
    // Expiry is not a decline: the main process skips the dismissal cooldown.
    const timer = setTimeout(() => close("expire"), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(
        MIN_RESUME_MS,
        remainingRef.current - (Date.now() - startedAt)
      );
    };
  }, [phase, paused, revision, close]);

  // A dictation starting over the prompt takes the pill back.
  useEffect(() => {
    if (isRecording) close("expire");
  }, [isRecording, close]);

  const presentation = getMeetingNotificationPresentation(prompt?.data ?? null);
  const onAction = useCallback(() => close(presentation.action), [close, presentation.action]);
  const onDismiss = useCallback(() => close("dismiss"), [close]);

  return {
    phase,
    title: presentation.title ?? t(presentation.titleKey ?? "meetingNotification.title"),
    body: t(presentation.bodyKey),
    actionLabel: t(presentation.actionKey),
    expanded: phase === "expanding" || phase === "open" || phase === "fading",
    contentVisible: phase === "open",
    windowActive: phase !== null && phase !== "collapsing",
    onAction,
    onDismiss,
  };
}
