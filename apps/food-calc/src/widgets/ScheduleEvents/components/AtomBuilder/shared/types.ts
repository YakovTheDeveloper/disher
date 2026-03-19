/**
 * Shared types for Atom Input components
 */

import { Atom } from '@/entities/schedule-event';

export interface BaseAtomInputProps {
    onAddAtom: (atom: Atom) => void;
    onClose: () => void;
}