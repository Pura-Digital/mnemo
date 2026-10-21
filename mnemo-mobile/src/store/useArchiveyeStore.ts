import { create } from 'zustand';
import {
  clearArchivEyeTokens,
  loadArchivEyeTokens,
  runArchivEyeOAuthFlow,
  type ArchivEyeTokenBundle,
} from '@/services/archiveye/archiveyeAuth';

interface ArchivEyeStore {
  connected: boolean;
  email: string | null;
  name: string | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

function applyBundle(set: (partial: Partial<ArchivEyeStore>) => void, bundle: ArchivEyeTokenBundle | null) {
  set({
    connected: Boolean(bundle),
    email: bundle?.email ?? null,
    name: bundle?.name ?? null,
  });
}

export const useArchiveyeStore = create<ArchivEyeStore>((set) => ({
  connected: false,
  email: null,
  name: null,
  loading: false,
  hydrate: async () => {
    const bundle = await loadArchivEyeTokens();
    applyBundle(set, bundle);
  },
  connect: async () => {
    set({ loading: true });
    try {
      const bundle = await runArchivEyeOAuthFlow();
      applyBundle(set, bundle);
    } finally {
      set({ loading: false });
    }
  },
  disconnect: async () => {
    await clearArchivEyeTokens();
    applyBundle(set, null);
  },
}));
