/** Schedule event row from LiveStore. `atoms` is a JSON string that needs parsing. */
export type ScheduleEvent = {
  id: string;
  date: string;
  userId: string;
  time: string;
  endTime: string;
  text: string;
  atoms: string; // JSON: Atom[]
  deletedAt: number | null;
};

export type ScheduleEventType = "negative" | "positive" | "custom" | "routine" | "sport";
