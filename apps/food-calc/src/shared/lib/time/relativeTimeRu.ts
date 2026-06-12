import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

// «2 дня назад» / «3 недели назад» — relative wall-clock distance from an ISO
// timestamp, Russian locale with the «назад» suffix. Returns '' for an
// unparseable input so the caller can render nothing instead of «Invalid Date».
export function relativeTimeRu(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale: ru });
}
