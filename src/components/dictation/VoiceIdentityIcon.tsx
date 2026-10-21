import { cn } from "../lib/utils";
import { MnemoMonoMark } from "./MnemoMonoMark";

interface VoiceIdentityIconProps {
  size?: number;
  agentMode?: boolean;
  className?: string;
}

/** Both voice modes use mnemo; their colour and motion retain the mode identity. */
export function VoiceIdentityIcon({
  size = 24,
  agentMode = false,
  className,
}: VoiceIdentityIconProps) {
  return (
    <span
      className={cn("voice-identity-icon relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      data-agent-mode={agentMode ? "true" : "false"}
      aria-hidden="true"
    >
      <MnemoMonoMark size={size} className="voice-identity-svg absolute inset-0 overflow-visible" />
    </span>
  );
}
