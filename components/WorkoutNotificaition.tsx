import React, { useState } from "react";
import { View, Text, Button, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../context/AppContext";

export default function WorkoutNotification() {
  const {
    tasks,
    notificationTime,
    setNotificationTime,
    checkAndScheduleWorkout,
  } = useAppContext();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todaysWorkout = tasks[today];

  const onChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedDate) {
      setNotificationTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
    }
  };

  // Create a Date object and set the hours and minutes to the notificationTime
  const notificationDate = new Date();
  notificationDate.setHours(notificationTime.hour, notificationTime.minute);

  return (
    <View>
      <Text>Today's Workout:</Text>
      {todaysWorkout && todaysWorkout.length > 0 ? (
        <Text>{todaysWorkout[0].name}</Text>
      ) : (
        <Text>No workout scheduled for today</Text>
      )}
      <Text>
        Notification Time: {notificationTime.hour}:
        {notificationTime.minute.toString().padStart(2, "0")}
      </Text>
      <Button
        onPress={() => setShowTimePicker(true)}
        title="Change Notification Time"
      />
      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={notificationDate} // Ensure value is a Date object
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
      <Button
        onPress={checkAndScheduleWorkout}
        title="Check and Schedule Workout"
      />
    </View>
  );
}
