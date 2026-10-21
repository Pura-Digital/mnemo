import { create } from "zustand";
import type { NoteMoveTarget } from "../hooks/useNoteDragAndDrop";

export interface NotesSidebarTreeHandlers {
  onDeleteNote: (id: number) => void | Promise<void>;
  onMoveNote: (noteId: number, target: NoteMoveTarget) => void | Promise<void>;
  onCreateFolderAndMove: (noteId: number, folderName: string) => void | Promise<void>;
  onNewNote: (spaceId: number | null, folderId: number | null) => void | Promise<void>;
  onShowStructureIntro: () => void;
  onOpenActionManager: () => void;
}

interface NotesSidebarHandlersState {
  handlers: NotesSidebarTreeHandlers | null;
  setHandlers: (handlers: NotesSidebarTreeHandlers | null) => void;
}

export const useNotesSidebarHandlersStore = create<NotesSidebarHandlersState>((set) => ({
  handlers: null,
  setHandlers: (handlers) => set({ handlers }),
}));
