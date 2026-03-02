import { types } from "mobx-state-tree";
import { SyncStatus } from "@/domain/commonListItem";
import {
    Atom,
    isValidAtom
} from './atom.types';
import { update } from "lodash";

/**
 * MST model definitions for each atom type
 */
const ScaleAtomModel = types.model("ScaleAtom", {
    kind: types.literal("scale"),
    value: types.number,
    label: types.optional(types.string, ""),
});

const TimeAtomModel = types.model("TimeAtom", {
    kind: types.literal("time"),
    start: types.optional(types.number, 0),
    end: types.optional(types.number, 0),
    durationMin: types.optional(types.number, 0),
});

const NumberAtomModel = types.model("NumberAtom", {
    kind: types.literal("number"),
    value: types.number,
    unit: types.optional(types.string, ""),
    label: types.optional(types.string, ""),
});

const TagAtomModel = types.model("TagAtom", {
    kind: types.literal("tag"),
    value: types.string,
});

const RelationAtomModel = types.model("RelationAtom", {
    kind: types.literal("relation"),
    value: types.string,
});

const FlagAtomModel = types.model("FlagAtom", {
    kind: types.literal("flag"),
    value: types.string,
});

const AtomModel = types.union(
    types.late(() => ScaleAtomModel),
    types.late(() => TimeAtomModel),
    types.late(() => NumberAtomModel),
    types.late(() => TagAtomModel),
    types.late(() => RelationAtomModel),
    types.late(() => FlagAtomModel),
);

export const ScheduleEvent = types.model("ScheduleEvent", {
    id: types.identifier,
    time: types.optional(types.string, ""),
    sync: types.optional(SyncStatus, {}),
    text: types.optional(types.string, ""),
    createdAt: types.number,
    atoms: types.array(AtomModel),
})
    .actions(self => ({
        addAtom(atom: Atom) {
            if (isValidAtom(atom)) {
                self.atoms.push(atom as any);
            }
        },

        removeAtom(index: number) {
            if (index >= 0 && index < self.atoms.length) {
                self.atoms.splice(index, 1);
            }
        },

        updateAtom(index: number, atom: Atom) {
            if (index >= 0 && index < self.atoms.length && isValidAtom(atom)) {
                self.atoms[index] = atom as any;
            }
        },

        setText(text: string) {
            self.text = text;
        },

        clearAtoms() {
            self.atoms.length = 0;
        },

        getAtomsByKind(kind: Atom['kind']): Atom[] {
            return self.atoms.filter(atom => atom.kind === kind) as Atom[];
        },

        hasAtomOfKind(kind: Atom['kind']): boolean {
            return self.atoms.some(atom => atom.kind === kind);
        },
        updateTime(newTime: string) {
            self.time = newTime;
        }
    }));