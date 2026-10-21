import type { LucideIconName } from '@/components/ui/SystemIcon';
import { filterInferenceModes } from '@/config/mnemoProduct';
import type { InferenceMode } from '@/types';

export type ModeDescriptor = {
  mode: InferenceMode;
  icon: string;
  mdIcon: LucideIconName;
  title: string;
  description: string;
};

export type InferenceScope = 'speech';

const BASE: Record<InferenceMode, Omit<ModeDescriptor, 'description'>> = {
  mnemo: {
    mode: 'mnemo',
    icon: 'cloud',
    mdIcon: 'Cloud',
    title: 'Pura LLM',
  },
  local: {
    mode: 'local',
    icon: 'iphone',
    mdIcon: 'Smartphone',
    title: 'Local',
  },
};

const SPEECH_DESCRIPTIONS: Record<InferenceMode, string> = {
  mnemo: 'Pura LLM requires sign-in.',
  local: 'Audio never leaves this phone.',
};

const SPEECH_TITLES: Partial<Record<InferenceMode, string>> = {
  local: 'On-Device',
};

const SCOPE_MODES: Record<InferenceScope, InferenceMode[]> = {
  speech: ['mnemo', 'local'],
};

export function getInferenceModes(scope: InferenceScope): ModeDescriptor[] {
  return filterInferenceModes(SCOPE_MODES[scope]).map((mode) => {
    const base = BASE[mode];
    return {
      ...base,
      title: SPEECH_TITLES[mode] || base.title,
      description: SPEECH_DESCRIPTIONS[mode],
    };
  });
}

export const MODE_LABELS: Record<InferenceMode, string> = {
  mnemo: 'Pura LLM',
  local: 'On-Device',
};
