import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAppContext } from "../context/AppContext";
import * as Notifications from "expo-notifications";

export const useWorkoutNotification = () => {
  const { tasks, sendWorkoutNotification } = useAppContext();
  const appState = useRef(AppState.currentState);
  const hasScheduledNotification = useRef(false);

  const checkAndNotifyWorkout = useCallback(async () => {
    if (hasScheduledNotification.current) return;

    const today = new Date().toISOString().split("T")[0];
    const todaysWorkout = tasks[today];

    if (todaysWorkout && todaysWorkout.length > 0) {
      await sendWorkoutNotification(todaysWorkout[0].name);
      hasScheduledNotification.current = true;
      console.log(`Notification scheduled for ${new Date().toLocaleString()}`);
    }
  }, [tasks, sendWorkoutNotification]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        hasScheduledNotification.current = false;
        checkAndNotifyWorkout();
      }
      appState.current = nextAppState;
    },
    [checkAndNotifyWorkout]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Request notification permissions and perform initial check
    (async () => {
      await Notifications.requestPermissionsAsync();
      await checkAndNotifyWorkout();
    })();

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange, checkAndNotifyWorkout]);
};
