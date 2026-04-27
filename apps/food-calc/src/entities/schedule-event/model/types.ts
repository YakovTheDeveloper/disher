import type { Atom } from "./atoms";

export interface ScheduleEvent {
  id: string;
  userId: string;
  date: string;
  time: string;
  endTime: string | null;
  text: string | null;
  atoms: Atom[];
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
