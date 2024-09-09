import React from "react";
import { View, Text } from "react-native";
import { useWorkoutNotification } from "../hooks/useWorkoutNotification";
import { useAppContext } from "../context/AppContext";

export default function WorkoutNotification() {
  useWorkoutNotification();
  const { tasks } = useAppContext();

  const today = new Date().toISOString().split("T")[0];
  const todaysWorkout = tasks[today];

  return (
    <View>
      <Text>Today's Workout:</Text>
      {todaysWorkout && todaysWorkout.length > 0 ? (
        <Text>{todaysWorkout[0].name}</Text>
      ) : (
        <Text>No workout scheduled for today</Text>
      )}
    </View>
  );
}
