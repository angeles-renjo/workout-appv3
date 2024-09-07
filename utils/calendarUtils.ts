//calendarUtils.ts
import { TasksState, WorkoutStatus } from "./calendarTypes";

export function generateMonthlyTasks(year: number, month: number): TasksState {
  const daysInMonth = new Date(year, month, 0).getDate();
  const tasks: TasksState = {};

  const taskTypes = [
    "Gym",
    "Run",
    "Yoga",
    "Swim",
    "Cycling",
    "HIIT",
    "Rest day",
    "Strength training",
    "Cardio",
    "Stretching",
    "Team sports",
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    // Generate only one task per day
    const randomTask = {
      name: taskTypes[Math.floor(Math.random() * taskTypes.length)],
    };

    tasks[date] = [randomTask]; // Wrap the single task in an array
  }

  return tasks;
}

export function getBackgroundColor(
  workoutStatus: WorkoutStatus,
  isSelected: boolean
): string {
  if (workoutStatus === "done") return "green";
  if (workoutStatus === "skipped") return "red";
  if (isSelected) return "blue";
  return "transparent";
}

export function getTextColor(
  isSelected: boolean,
  workoutStatus: WorkoutStatus | undefined
): string {
  return isSelected || workoutStatus ? "white" : "black";
}
