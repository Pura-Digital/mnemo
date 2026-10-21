import { create } from "zustand";
import {
  applyAiSetupLocalStorage,
  applySetupLaneToInferenceModes,
  captureAiSetupLocalStorage,
  type AiSetupLane,
} from "../helpers/aiSetupStorage";
import { isPuraLlmOfferedOnStandalone } from "../config/mnemoProduct";

const STORAGE_KEY = "mnemoAiSetups_v1";

export interface AiSetup {
  id: string;
  name: string;
  lane: AiSetupLane;
  storage: Record<string, string>;
}

interface AiSetupState {
  setups: AiSetup[];
  activeId: string;
  addSetup: (name?: string) => void;
  removeSetup: (id: string) => void;
  renameSetup: (id: string, name: string) => void;
  setActiveSetup: (id: string) => void;
  setSetupLane: (id: string, lane: AiSetupLane) => void;
  persistActiveSetup: () => void;
  hydrate: () => void;
}

function newId(): string {
  return `setup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultSetup(
  name: string,
  lane: AiSetupLane = isPuraLlmOfferedOnStandalone() ? "pura" : "providers"
): AiSetup {
  return {
    id: newId(),
    name,
    lane,
    storage: captureAiSetupLocalStorage(),
  };
}

function readPersisted(): Pick<AiSetupState, "setups" | "activeId"> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { setups: AiSetup[]; activeId: string };
    if (!Array.isArray(parsed.setups) || !parsed.activeId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersisted(setups: AiSetup[], activeId: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ setups, activeId }));
}

export const useAiSetupStore = create<AiSetupState>()((set, get) => ({
  setups: [],
  activeId: "",

  hydrate: () => {
    const persisted = readPersisted();
    if (persisted && persisted.setups.length > 0) {
      set(persisted);
      const active = persisted.setups.find((s) => s.id === persisted.activeId);
      if (active) applyAiSetupLocalStorage(active.storage);
      return;
    }
    const initial = defaultSetup("Default");
    writePersisted([initial], initial.id);
    set({ setups: [initial], activeId: initial.id });
  },

  persistActiveSetup: () => {
    const { setups, activeId } = get();
    const snapshot = captureAiSetupLocalStorage();
    const next = setups.map((s) => (s.id === activeId ? { ...s, storage: snapshot } : s));
    set({ setups: next });
    writePersisted(next, activeId);
  },

  addSetup: (name) => {
    get().persistActiveSetup();
    const setup = defaultSetup(
      name?.trim() || `Setup ${get().setups.length + 1}`,
      get().setups.find((s) => s.id === get().activeId)?.lane ?? "providers"
    );
    const setups = [...get().setups, setup];
    set({ setups, activeId: setup.id });
    applyAiSetupLocalStorage(setup.storage);
    applySetupLaneToInferenceModes(setup.lane);
    writePersisted(setups, setup.id);
  },

  removeSetup: (id) => {
    const { setups, activeId } = get();
    if (setups.length <= 1) return;
    get().persistActiveSetup();
    const next = setups.filter((s) => s.id !== id);
    const nextActive = id === activeId ? next[0]!.id : activeId;
    set({ setups: next, activeId: nextActive });
    const active = next.find((s) => s.id === nextActive)!;
    applyAiSetupLocalStorage(active.storage);
    applySetupLaneToInferenceModes(active.lane);
    writePersisted(next, nextActive);
  },

  renameSetup: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const setups = get().setups.map((s) => (s.id === id ? { ...s, name: trimmed } : s));
    set({ setups });
    writePersisted(setups, get().activeId);
  },

  setActiveSetup: (id) => {
    if (id === get().activeId) return;
    get().persistActiveSetup();
    const target = get().setups.find((s) => s.id === id);
    if (!target) return;
    set({ activeId: id });
    applyAiSetupLocalStorage(target.storage);
    applySetupLaneToInferenceModes(target.lane);
    writePersisted(get().setups, id);
  },

  setSetupLane: (id, lane) => {
    get().persistActiveSetup();
    const setups = get().setups.map((s) => (s.id === id ? { ...s, lane } : s));
    set({ setups });
    writePersisted(setups, get().activeId);
    if (id === get().activeId) {
      applySetupLaneToInferenceModes(lane);
    }
  },
}));
