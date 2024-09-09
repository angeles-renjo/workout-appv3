import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAppContext } from "../context/AppContext";
import * as Notifications from "expo-notifications";

export const useWorkoutNotification = () => {
  const { tasks, sendWorkoutNotification } = useAppContext();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Request notification permissions
    Notifications.requestPermissionsAsync();

    // Check for workout on app open
    checkAndNotifyWorkout();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      checkAndNotifyWorkout();
    }
    appState.current = nextAppState;
  };

  const checkAndNotifyWorkout = () => {
    const today = new Date().toISOString().split("T")[0];
    const todaysWorkout = tasks[today];

    if (todaysWorkout && todaysWorkout.length > 0) {
      sendWorkoutNotification(todaysWorkout[0].name);
    }
  };
};
