import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Atom } from "./atoms";

export interface EventDraft {
  id: string;
  text: string;
  time: string;
  createdAt: number;
  atoms: Atom[];
}

const POPULAR_TAGS_LIMIT = 10;
const MAX_TAG_HISTORY = 100;

interface EventDraftStore {
  draft: EventDraft;
  setText: (text: string) => void;
  setTime: (time: string) => void;
  addAtom: (atom: Atom) => void;
  removeAtom: (index: number) => void;
  updateAtom: (index: number, atom: Atom) => void;
  clearAtoms: () => void;
  clear: () => void;

  tagHistory: string[];
  tagFrequency: Record<string, number>;
  recordTagUsage: (tag: string) => void;
  clearTagHistory: () => void;
  getPopularTags: () => string[];
  getRecentTags: () => string[];
}

const DEFAULT_DRAFT = (): EventDraft => ({
  id: uuid(),
  text: "",
  time: "",
  createdAt: Date.now(),
  atoms: [],
});

export const useEventDraftStore = create<EventDraftStore>()(
  devtools(
    (set, get) => ({
      draft: DEFAULT_DRAFT(),
      setText: (text) => set((s) => ({ draft: { ...s.draft, text } }), false, "setText"),
      setTime: (time) => set((s) => ({ draft: { ...s.draft, time } }), false, "setTime"),
      addAtom: (atom) =>
        set((s) => ({ draft: { ...s.draft, atoms: [...s.draft.atoms, atom] } }), false, "addAtom"),
      removeAtom: (index) =>
        set(
          (s) => ({ draft: { ...s.draft, atoms: s.draft.atoms.filter((_, i) => i !== index) } }),
          false,
          "removeAtom",
        ),
      updateAtom: (index, atom) =>
        set(
          (s) => ({
            draft: { ...s.draft, atoms: s.draft.atoms.map((a, i) => (i === index ? atom : a)) },
          }),
          false,
          "updateAtom",
        ),
      clearAtoms: () =>
        set((s) => ({ draft: { ...s.draft, atoms: [] } }), false, "clearAtoms"),
      clear: () => set({ draft: DEFAULT_DRAFT() }, false, "clear"),

      tagHistory: [],
      tagFrequency: {},
      recordTagUsage: (tag) => {
        if (!tag.trim()) return;
        set((s) => {
          const freq = { ...s.tagFrequency, [tag]: (s.tagFrequency[tag] ?? 0) + 1 };
          let history = s.tagHistory.filter((t) => t !== tag);
          history.push(tag);
          if (history.length > MAX_TAG_HISTORY) history = history.slice(-MAX_TAG_HISTORY);
          return { tagFrequency: freq, tagHistory: history };
        }, false, "recordTag");
      },
      clearTagHistory: () => set({ tagHistory: [], tagFrequency: {} }, false, "clearTags"),
      getPopularTags: () =>
        Object.entries(get().tagFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, POPULAR_TAGS_LIMIT)
          .map(([tag]) => tag),
      getRecentTags: () => [...get().tagHistory].reverse().slice(0, POPULAR_TAGS_LIMIT),
    }),
    { name: "event-draft" },
  ),
);
