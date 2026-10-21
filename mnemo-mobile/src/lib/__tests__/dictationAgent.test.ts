import {
  getDictationAgentName,
  isDictationAgentApplicable,
  detectAgentMention,
} from '@/lib/dictationAgent';
import type { UserConfig } from '@/types';

const baseConfig: UserConfig = { defaultMode: 'cloud' };

describe('getDictationAgentName', () => {
  it('returns the default name when dictationAgentName is unset', () => {
    expect(getDictationAgentName(baseConfig)).toBe('mnemo');
  });

  it('returns the default name when dictationAgentName is blank', () => {
    expect(getDictationAgentName({ ...baseConfig, dictationAgentName: '   ' })).toBe('mnemo');
  });

  it('maps the legacy default to mnemo', () => {
    expect(getDictationAgentName({ ...baseConfig, dictationAgentName: 'Mnemo' })).toBe('mnemo');
  });

  it('returns the configured name trimmed', () => {
    expect(getDictationAgentName({ ...baseConfig, dictationAgentName: '  Aria  ' })).toBe('Aria');
  });

  it('returns the configured name as-is when already trimmed', () => {
    expect(getDictationAgentName({ ...baseConfig, dictationAgentName: 'Aria' })).toBe('Aria');
  });
});

describe('isDictationAgentApplicable', () => {
  it('returns true when cloud mode and agent enabled', () => {
    expect(
      isDictationAgentApplicable('cloud', { ...baseConfig, dictationAgentEnabled: true }),
    ).toBe(true);
  });

  it('returns false when cloud mode but agent disabled', () => {
    expect(
      isDictationAgentApplicable('cloud', { ...baseConfig, dictationAgentEnabled: false }),
    ).toBe(false);
  });

  it('returns true when cloud mode and agent not set (default on)', () => {
    expect(isDictationAgentApplicable('cloud', baseConfig)).toBe(true);
  });

  it('returns false when cloud mode but agent explicitly disabled', () => {
    expect(
      isDictationAgentApplicable('cloud', { ...baseConfig, dictationAgentEnabled: false }),
    ).toBe(false);
  });

  it('returns false when private mode even if agent enabled', () => {
    expect(
      isDictationAgentApplicable('private', { ...baseConfig, dictationAgentEnabled: true }),
    ).toBe(false);
  });
});

describe('detectAgentMention — Layer 1: word-boundary exact match', () => {
  it('detects the name at word boundaries', () => {
    expect(detectAgentMention('Hey Mnemo write a follow-up email', 'Mnemo')).toBe(true);
  });

  it('detects the name case-insensitively', () => {
    expect(detectAgentMention('hey mnemo do this', 'Mnemo')).toBe(true);
    expect(detectAgentMention('hey OPENWHISPR do this', 'Mnemo')).toBe(true);
  });

  it('does not match when name appears only as a substring of another word', () => {
    expect(detectAgentMention('this is MnemoPro not the agent', 'Mnemo')).toBe(false);
  });

  it('does not match when transcript does not contain the name', () => {
    expect(detectAgentMention('write a follow-up email for the client', 'Mnemo')).toBe(false);
  });

  it('detects name with punctuation adjacent (word boundary)', () => {
    expect(detectAgentMention('okay, Mnemo, please help', 'Mnemo')).toBe(true);
  });
});

describe('detectAgentMention — Layer 2: space-normalized join', () => {
  it('detects compound name spoken with a space', () => {
    // STT splits "Mnemo" into "Open Whispr"
    expect(detectAgentMention('hey Open Whispr write this', 'Mnemo')).toBe(true);
  });

  it('is case-insensitive on space-normalized match', () => {
    expect(detectAgentMention('hey open whispr write this', 'Mnemo')).toBe(true);
  });

  it('matches a two-word configured name', () => {
    // Name is "My Agent", transcript says "My Agent" (exact)
    expect(detectAgentMention('hey my agent do the thing', 'My Agent')).toBe(true);
  });
});

describe('detectAgentMention — Layer 3: Levenshtein fuzzy match', () => {
  it('returns false for names of 4 chars or fewer (zero edits allowed)', () => {
    expect(detectAgentMention('hey Arua write this', 'Aria')).toBe(false);
  });

  it('tolerates 1 edit for a 5–6 char name', () => {
    expect(detectAgentMention('hey Jarwis write this', 'Jarvis')).toBe(true);
  });

  it('tolerates 2 edits for names longer than 6 chars', () => {
    // "openwhizer" is 2 edits from "mnemo" (len 10)
    expect(detectAgentMention('hey openwhizer write this', 'Mnemo')).toBe(true);
  });

  it('does not match when edits exceed the threshold', () => {
    expect(detectAgentMention('hey openwhizzler write this', 'Mnemo')).toBe(false);
  });

  it('tolerates 1 edit on a combined two-word mishearing', () => {
    // "open whisper" combined → "openwhisper" is 1 edit from "mnemo"
    expect(detectAgentMention('okay open whisper please help', 'Mnemo')).toBe(true);
  });
});

describe('detectAgentMention — edge cases', () => {
  it('returns false for empty transcript', () => {
    expect(detectAgentMention('', 'Mnemo')).toBe(false);
  });

  it('returns false when name is too short (< 2 chars)', () => {
    expect(detectAgentMention('hey A do this', 'A')).toBe(false);
  });

  it('returns false when name is blank/empty', () => {
    expect(detectAgentMention('hey do this', '')).toBe(false);
  });
});
