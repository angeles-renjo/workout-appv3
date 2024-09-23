import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../context/AppContext";

export default function WorkoutNotification() {
  const { notificationTime, setNotificationTime, checkAndScheduleWorkout } =
    useAppContext();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(notificationTime);

  const showPicker = () => setShowTimePicker(true);
  const hidePicker = () => setShowTimePicker(false);

  const onChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
    }
    if (Platform.OS === "android") {
      hidePicker();
    }
  };

  const confirmTime = () => {
    setNotificationTime(tempTime);
    hidePicker();
  };

  const notificationDate = new Date();
  notificationDate.setHours(tempTime.hour, tempTime.minute);

  const formatTime = (time: { hour: number; minute: number }) => {
    let hours = time.hour;
    const minutes = time.minute.toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = hours.toString().padStart(2, "0");
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const formattedTime = formatTime(notificationTime);

  const renderIOSPicker = () => (
    <Modal transparent={true} visible={showTimePicker} animationType="slide">
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "white", padding: 16 }}>
          <DateTimePicker
            testID="dateTimePicker"
            value={notificationDate}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onChange}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <TouchableOpacity onPress={hidePicker} style={{ padding: 10 }}>
              <Text style={{ color: "red" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmTime} style={{ padding: 10 }}>
              <Text style={{ color: "blue" }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center items-center">
        <View className="bg-white rounded-xl shadow-lg p-6 w-full mb-6">
          <Text className="text-xl font-semibold mb-2 text-gray-800">
            Notification Time
          </Text>
          <Text className="text-5xl font-bold text-blue-500 mb-4">
            {formattedTime}
          </Text>
          <TouchableOpacity
            onPress={showPicker}
            className="bg-blue-500 py-3 px-6 rounded-full"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Change Time
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={checkAndScheduleWorkout}
          className="bg-green-500 py-4 px-6 rounded-full w-full"
        >
          <Text className="text-white text-center font-bold text-lg">
            Check and Schedule Workout
          </Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === "ios"
        ? renderIOSPicker()
        : showTimePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={notificationDate}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onChange}
            />
          )}
    </SafeAreaView>
  );
}
