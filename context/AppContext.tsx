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
} from "../utils/calendarTypes";
import { generateYearlyTasks } from "@/utils/calendarUtils";
import * as Notifications from "expo-notifications";

interface AppContextType {
  tasks: TasksState;
  setTasks: React.Dispatch<React.SetStateAction<TasksState>>;
  workoutStatus: WorkoutStatusState;
  setWorkoutStatus: React.Dispatch<React.SetStateAction<WorkoutStatusState>>;
  applyTemplate: (template: Template) => void;
  sendWorkoutNotification: (workout: string) => Promise<void>;
  checkAndNotifyWorkout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<TasksState>({});
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatusState>({});
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
  };

  const sendWorkoutNotification = async (workout: string) => {
    console.log(`Sending notification for workout: ${workout}`);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's Workout",
        body: `Don't forget your ${workout} workout today!`,
        data: { workout },
      },
      trigger: null,
    });
    console.log("Notification sent successfully");
  };

  const checkAndNotifyWorkout = useCallback(() => {
    console.log("Checking for today's workout");
    const today = new Date().toISOString().split("T")[0];
    const todaysWorkout = tasks[today];

    if (todaysWorkout && todaysWorkout.length > 0 && !workoutStatus[today]) {
      console.log(`Found workout for today: ${todaysWorkout[0].name}`);
      sendWorkoutNotification(todaysWorkout[0].name);
    } else {
      console.log(
        "No workout found for today or workout already completed/skipped"
      );
    }
  }, [tasks, workoutStatus]);

  useEffect(() => {
    console.log("AppContext useEffect running");
    const loadData = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem("tasks");
        const storedWorkoutStatus = await AsyncStorage.getItem("workoutStatus");
        if (storedTasks) {
          console.log("Loaded tasks from AsyncStorage");
          setTasks(JSON.parse(storedTasks));
        }
        if (storedWorkoutStatus) {
          console.log("Loaded workout status from AsyncStorage");
          setWorkoutStatus(JSON.parse(storedWorkoutStatus));
        }
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsDataLoaded(true);
      }
    };
    loadData();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const workout = response.notification.request.content.data.workout;
        console.log(`Notification tapped for workout: ${workout}`);
        // Navigate to workout details (implement this navigation logic)
      }
    );

    // Set up AppState listener
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        console.log("App came to foreground, checking for workout");
        checkAndNotifyWorkout();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      console.log("Cleaning up AppContext useEffect");
      subscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  // New useEffect to check for workout after data is loaded
  useEffect(() => {
    if (isDataLoaded) {
      console.log("Data loaded, checking for workout");
      checkAndNotifyWorkout();
    }
  }, [isDataLoaded, checkAndNotifyWorkout]);

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        workoutStatus,
        setWorkoutStatus,
        applyTemplate,
        sendWorkoutNotification,
        checkAndNotifyWorkout,
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
