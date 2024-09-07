// calendarTypes.ts

import { DateData } from "react-native-calendars";

export interface Task {
  name: string;
  completed: boolean;
}

export type TasksState = Record<string, Task[]>;

export type WorkoutStatus = "done" | "skipped" | undefined;

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

export interface Template {
  id: number;
  name: string;
  description: string;
  tasks: {
    day: number;
    exercise: string;
  }[];
}

export interface DayContentProps {
  date: DateData;
  task?: string;
  textColor: string;
}
