import { TasksState, WorkoutStatus, Task } from "./calendarTypes";

export function generateYearlyTasks(): TasksState {
  const tasks: TasksState = {};
  const taskTypes = [
    "Gym",
    "Run",
    "Yoga",
    "Strength training",
    "Cardio",
    "Stretching",
    "Team sports",
  ];

  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const date = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Generate only one task per day
    const randomTask: Task = {
      name: taskTypes[Math.floor(Math.random() * taskTypes.length)],
      completed: false, // Add the completed property
    };

    tasks[date] = [randomTask]; // Wrap the single task in an array
  }

  return tasks;
}
export const getBackgroundColor = (
  workoutStatus: WorkoutStatus,
  isSelected: boolean
): string => {
  if (isSelected) return "blue";
  switch (workoutStatus) {
    case "done":
      return "green";
    case "skipped":
      return "red";
    default:
      return "transparent";
  }
};

export const getTextColor = (
  isSelected: boolean,
  workoutStatus: WorkoutStatus
): string => {
  if (isSelected || workoutStatus) return "white";
  return "black";
};
