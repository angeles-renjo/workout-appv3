//calendarTypes.ts

import { DateData } from "react-native-calendars";
export interface Task {
  name: string;
}

export type TasksState = Record<string, Task[]>;

export type WorkoutStatus = "done" | "skipped" | null;

export type WorkoutStatusState = Record<string, WorkoutStatus>;

export interface MarkedDate {
  task?: string;
  workoutStatus?: WorkoutStatus;
  selected?: boolean;
}

export type MarkedDates = Record<string, MarkedDate>;

export interface DayProps {
  date?: DateData;
  state?: "selected" | "disabled" | "today" | "";
  marking?: MarkedDate;
  onPress?: (date: DateData) => void;
}
