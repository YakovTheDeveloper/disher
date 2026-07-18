import type { DateStr } from './model';

export const DATE_FORMAT = 'dd-MM-yyyy';

export interface ParsedDay {
  date: Date;
  dateStr: DateStr;
}
