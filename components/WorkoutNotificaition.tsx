import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../context/AppContext";
import { StatusBar } from "expo-status-bar";

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

  const notificationDate = new Date();
  notificationDate.setHours(notificationTime.hour, notificationTime.minute);

  return (
    <View className="flex-1 bg-gray-100 p-6 justify-center">
      <StatusBar style="auto" />

      <View className="bg-white rounded-lg shadow-md p-6 mb-6">
        <Text className="text-xl font-semibold mb-2 text-gray-800">
          Notification Time
        </Text>
        <Text className="text-3xl font-bold text-blue-600 mb-4">
          {notificationTime.hour}:
          {notificationTime.minute.toString().padStart(2, "0")}
        </Text>
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          className="bg-blue-500 py-3 px-6 rounded-full"
        >
          <Text className="text-white text-center font-semibold">
            Change Time
          </Text>
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={notificationDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}

      <TouchableOpacity
        onPress={checkAndScheduleWorkout}
        className="bg-green-500 py-4 px-6 rounded-full"
      >
        <Text className="text-white text-center font-bold text-lg">
          Check and Schedule Workout
        </Text>
      </TouchableOpacity>
    </View>
  );
}
