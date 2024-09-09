import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import {
  TasksState,
  WorkoutStatusState,
  Template,
  NotificationTime,
} from "../utils/calendarTypes";
import { generateYearlyTasks } from "@/utils/calendarUtils";
import * as Notifications from "expo-notifications";

interface AppContextType {
  tasks: TasksState;
  setTasks: React.Dispatch<React.SetStateAction<TasksState>>;
  workoutStatus: WorkoutStatusState;
  setWorkoutStatus: React.Dispatch<React.SetStateAction<WorkoutStatusState>>;
  notificationTime: NotificationTime;
  setNotificationTime: (time: NotificationTime) => Promise<void>;
  applyTemplate: (template: Template) => void;
  sendWorkoutNotification: (workout: string) => Promise<void>;
  checkAndScheduleWorkout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_NOTIFICATION_TIME: NotificationTime = { hour: 8, minute: 0 };

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<TasksState>({});
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatusState>({});
  const [notificationTime, setNotificationTimeState] =
    useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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

  const setNotificationTime = async (time: NotificationTime) => {
    try {
      await AsyncStorage.setItem("notificationTime", JSON.stringify(time));
      setNotificationTimeState(time);
      await checkAndScheduleWorkout(); // Reschedule with new time
    } catch (error) {
      console.error("Error saving notification time:", error);
    }
  };

  const applyTemplate = (template: Template) => {
    const today = new Date();
    const newTasks: TasksState = {};

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
    checkAndScheduleWorkout(); // Schedule workout after applying template
  };

  const sendWorkoutNotification = async (workout: string) => {
    console.log(`Scheduling notification for workout: ${workout}`);
    const { hour, minute } = notificationTime;
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute
    );

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1); // Schedule for next day if time has passed
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's Workout",
        body: `Don't forget your ${workout} workout today!`,
        data: { workout },
      },
      trigger: {
        date: scheduledTime,
      },
    });
    console.log(`Notification scheduled for ${scheduledTime.toLocaleString()}`);
  };

  const checkAndScheduleWorkout = useCallback(async () => {
    console.log("Checking and scheduling workout");
    const today = new Date().toISOString().split("T")[0];
    const todaysWorkout = tasks[today];

    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (todaysWorkout && todaysWorkout.length > 0 && !workoutStatus[today]) {
      console.log(`Found workout for today: ${todaysWorkout[0].name}`);
      await sendWorkoutNotification(todaysWorkout[0].name);
    } else {
      console.log(
        "No workout found for today or workout already completed/skipped"
      );
    }
  }, [tasks, workoutStatus, notificationTime, sendWorkoutNotification]); // Add sendWorkoutNotification

  const loadData = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem("tasks");
      if (storedTasks) {
        console.log("Loaded tasks from AsyncStorage");
        setTasks(JSON.parse(storedTasks));
      }

      const storedWorkoutStatus = await AsyncStorage.getItem("workoutStatus");
      if (storedWorkoutStatus) {
        console.log("Loaded workout status from AsyncStorage");
        setWorkoutStatus(JSON.parse(storedWorkoutStatus));
      }

      const storedNotificationTime = await AsyncStorage.getItem(
        "notificationTime"
      );
      if (storedNotificationTime) {
        console.log("Loaded notification time from AsyncStorage");
        setNotificationTimeState(JSON.parse(storedNotificationTime));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // New useEffect to check for workout after data is loaded
  useEffect(() => {
    if (isDataLoaded) {
      console.log("Data loaded, checking and scheduling workout");
      checkAndScheduleWorkout();
    }
  }, [isDataLoaded, checkAndScheduleWorkout]);

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        workoutStatus,
        setWorkoutStatus,
        notificationTime,
        setNotificationTime,
        applyTemplate,
        sendWorkoutNotification,
        checkAndScheduleWorkout,
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
