import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TasksState,
  WorkoutStatusState,
  Template,
  NotificationTime,
} from "../utils/calendarTypes";
import * as Notifications from "expo-notifications";

interface AppContextType {
  tasks: TasksState;
  setTasks: React.Dispatch<React.SetStateAction<TasksState>>;
  workoutStatus: WorkoutStatusState;
  setWorkoutStatus: React.Dispatch<React.SetStateAction<WorkoutStatusState>>;
  notificationTime: NotificationTime;
  setNotificationTime: (time: NotificationTime) => Promise<void>;
  applyTemplate: (template: Template) => Promise<void>;
  sendWorkoutNotification: (workout: string) => Promise<void>;
  checkAndScheduleWorkout: () => Promise<void>;
  resetCurrentDayInteraction: () => Promise<void>;
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
      await checkAndScheduleWorkout();
    } catch (error) {
      console.error("Error saving notification time:", error);
    }
  };

  const resetCurrentDayInteraction = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const interactionKeys = keys.filter((key) =>
        key.startsWith("interaction-")
      );
      await AsyncStorage.multiRemove(interactionKeys);

      setWorkoutStatus({});
      await AsyncStorage.setItem("workoutStatus", JSON.stringify({}));
    } catch (error) {
      console.error("Error resetting interactions:", error);
    }
  }, []);

  const sendWorkoutNotification = useCallback(
    async (workout: string) => {
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
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

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
      console.log(
        `Notification scheduled for ${scheduledTime.toLocaleString()}`
      );
    },
    [notificationTime]
  );

  const checkAndScheduleWorkout = useCallback(async () => {
    console.log("Checking and scheduling workout");
    const today = new Date().toISOString().split("T")[0];
    const todaysWorkout = tasks[today];

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (todaysWorkout && todaysWorkout.length > 0 && !workoutStatus[today]) {
      console.log(`Found workout for today: ${todaysWorkout[0].name}`);
      await sendWorkoutNotification(todaysWorkout[0].name);
    } else {
      console.log(
        "No workout found for today or workout already completed/skipped"
      );
    }
  }, [tasks, workoutStatus, notificationTime, sendWorkoutNotification]);

  const applyTemplate = useCallback(
    async (template: Template) => {
      const today = new Date();
      const newTasks: TasksState = {};
      const templateLength = template.tasks.length;

      // Generate tasks for a full year (365 days)
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split("T")[0];

        const taskIndex = i % templateLength;
        const task = template.tasks[taskIndex];

        newTasks[dateString] = [
          {
            name: task.exercise,
            completed: false,
          },
        ];
      }

      setTasks(newTasks);
      await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));

      await resetCurrentDayInteraction();
      await checkAndScheduleWorkout();
    },
    [checkAndScheduleWorkout, resetCurrentDayInteraction]
  );
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
    return () => {
      Notifications.cancelAllScheduledNotificationsAsync();
    };
  }, []);

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
        resetCurrentDayInteraction,
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
