import { isCatalogId } from '@/shared/data/catalog';

/** True when the entity's id was minted by the user (not in the system catalog). */
export function isCreatedByUser(id: string | undefined | null): boolean {
  return id != null && id !== '' && !isCatalogId(id);
}
