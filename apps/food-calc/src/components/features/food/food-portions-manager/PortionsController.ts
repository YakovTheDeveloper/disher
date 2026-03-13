import { makeAutoObservable } from 'mobx';

export type PortionDraft = {
  label: string;
  grams: number;
};

/**
 * Local UI controller for the portions manager.
 * Manages editing state, draft creation, and delegates
 * persistence to the entity's own portion actions.
 */
export class PortionsManagerController {
  isAdding = false;
  editingLabel: string | null = null;
  draft: PortionDraft = { label: '', grams: 0 };

  constructor() {
    makeAutoObservable(this);
  }

  startAdding() {
    this.isAdding = true;
    this.editingLabel = null;
    this.draft = { label: '', grams: 0 };
  }

  startEditing(label: string, grams: number) {
    this.isAdding = false;
    this.editingLabel = label;
    this.draft = { label, grams };
  }

  updateDraft(field: keyof PortionDraft, value: string | number) {
    if (field === 'label') this.draft.label = value as string;
    if (field === 'grams') this.draft.grams = value as number;
  }

  cancel() {
    this.isAdding = false;
    this.editingLabel = null;
    this.draft = { label: '', grams: 0 };
  }

  get isEditing() {
    return this.isAdding || this.editingLabel !== null;
  }

  get isValid() {
    return this.draft.label.trim().length > 0 && this.draft.grams > 0;
  }
}
