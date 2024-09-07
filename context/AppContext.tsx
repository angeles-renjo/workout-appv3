import React, { createContext, useState, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TasksState,
  WorkoutStatusState,
  Template,
} from "../utils/calendarTypes";
import { generateYearlyTasks } from "@/utils/calendarUtils";

interface AppContextType {
  tasks: TasksState;
  setTasks: React.Dispatch<React.SetStateAction<TasksState>>;
  workoutStatus: WorkoutStatusState;
  setWorkoutStatus: React.Dispatch<React.SetStateAction<WorkoutStatusState>>;
  applyTemplate: (template: Template) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<TasksState>({});
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatusState>({});

  const saveTasks = async (newTasks: TasksState) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

  const saveWorkoutStatus = async (newWorkoutStatus: WorkoutStatusState) => {
    try {
      await AsyncStorage.setItem(
        "workoutStatus",
        JSON.stringify(newWorkoutStatus)
      );
    } catch (error) {
      console.error("Error saving workout status:", error);
    }
  };

  const applyTemplate = (template: Template) => {
    const today = new Date();
    const newTasks: TasksState = {};

    // Reset workout statuses
    setWorkoutStatus({});
    saveWorkoutStatus({});

    for (let i = 0; i < 52; i++) {
      template.tasks.forEach((task) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i * 7 + task.day - 1);
        const dateString = date.toISOString().split("T")[0];

        newTasks[dateString] = [
          {
            name: task.exercise,
            completed: false,
          },
        ];
      });
    }

    setTasks(newTasks);
    saveTasks(newTasks);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        workoutStatus,
        setWorkoutStatus,
        applyTemplate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
