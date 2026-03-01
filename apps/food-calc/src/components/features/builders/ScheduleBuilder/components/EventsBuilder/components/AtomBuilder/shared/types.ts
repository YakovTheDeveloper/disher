/**
 * Shared types for Atom Input components
 */

import { Atom } from '@/domain/schedule/scheduleEvent/atom.types';

export interface BaseAtomInputProps {
    onAddAtom: (atom: Atom) => void;
    onClose: () => void;
}