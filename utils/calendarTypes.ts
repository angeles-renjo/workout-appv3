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
  isCurrentDay?: boolean; // Added this instead of currentDate
}

export type MarkedDates = Record<string, MarkedDate>;

export interface DayProps {
  date?: DateData;
  state?: "selected" | "disabled" | "today" | "";
  marking?: MarkedDate;
  onPress?: (date: DateData) => void;
  currentDate?: string; // Added as a prop instead of in marking
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

export interface NotificationTime {
  hour: number;
  minute: number;
}
