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

// The Оценка modal edits ONE scale at a time, held here as a pending value.
// `touched` gates commit: an untouched form (default 5, no label) must NOT
// attach a phantom «5/10» to every event — the user may have opened the modal
// just to read the hint and close. Any edit flips `touched`; `commitPendingScale`
// (called on the modal's «Готово»/close) upserts it into `draft.atoms`.
export interface PendingScale {
  value: number | "";
  label: string;
  touched: boolean;
}

const EMPTY_PENDING = (): PendingScale => ({ value: 5, label: "", touched: false });

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

  // Pending scale being edited in the Оценка form. An event can hold MULTIPLE
  // scale atoms (one per phenomenon, e.g. «Настроение 7» + «Энергия 4»); this is
  // the single one currently in the form, committed into atoms by label.
  pendingScale: PendingScale;
  setPendingScale: (patch: Partial<Pick<PendingScale, "value" | "label">>) => void;
  hydratePendingScale: (scale: { value: number; label?: string }) => void;
  resetPendingScale: () => void;
  /** Upsert the pending scale into atoms keyed by LABEL (same label replaces,
   *  new label appends → multiple states per event). No-op if untouched. */
  commitPendingScale: () => void;

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
        set((s) => ({ draft: { ...s.draft, atoms: [] }, pendingScale: EMPTY_PENDING() }), false, "clearAtoms"),
      clear: () => set({ draft: DEFAULT_DRAFT(), pendingScale: EMPTY_PENDING() }, false, "clear"),

      pendingScale: EMPTY_PENDING(),
      setPendingScale: (patch) =>
        set((s) => ({ pendingScale: { ...s.pendingScale, ...patch, touched: true } }), false, "setPendingScale"),
      hydratePendingScale: (scale) =>
        set({ pendingScale: { value: scale.value, label: scale.label ?? "", touched: true } }, false, "hydratePendingScale"),
      resetPendingScale: () => set({ pendingScale: EMPTY_PENDING() }, false, "resetPendingScale"),
      commitPendingScale: () =>
        set((s) => {
          const p = s.pendingScale;
          if (!p.touched) return { pendingScale: EMPTY_PENDING() };
          const value = typeof p.value === "number" ? p.value : 5;
          const label = p.label.trim() || undefined;
          const atom: Atom = { kind: "scale", value: value || 5, label };
          // Upsert by label: a scale with the SAME label replaces it (editing),
          // a new label appends (another state). Label-less matches label-less.
          const idx = s.draft.atoms.findIndex((a) => a.kind === "scale" && (a.label ?? "") === (label ?? ""));
          const atoms =
            idx >= 0
              ? s.draft.atoms.map((a, i) => (i === idx ? atom : a))
              : [...s.draft.atoms, atom];
          return { draft: { ...s.draft, atoms }, pendingScale: EMPTY_PENDING() };
        }, false, "commitPendingScale"),

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
