import type { Atom } from "./atoms";

export interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  endTime: string;
  text: string;
  atoms: Atom[];
  createdAt: string;
}
