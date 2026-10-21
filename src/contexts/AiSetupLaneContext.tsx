import { createContext, useContext } from "react";
import type { AiSetupLane } from "../helpers/aiSetupStorage";

const AiSetupLaneContext = createContext<AiSetupLane | null>(null);

export function AiSetupLaneProvider({
  lane,
  children,
}: {
  lane: AiSetupLane;
  children: React.ReactNode;
}) {
  return <AiSetupLaneContext.Provider value={lane}>{children}</AiSetupLaneContext.Provider>;
}

/** Active AI setup backend when editing unified AI settings; null elsewhere. */
export function useAiSetupLane(): AiSetupLane | null {
  return useContext(AiSetupLaneContext);
}
