/** True when the item was created by a real user (not part of the system catalog). */
export function isCreatedByUser(userId: string | undefined | null): boolean {
  return userId != null && userId !== '';
}
