import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  useColorScheme,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../context/AppContext";
import { Colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";

export default function WorkoutNotification() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { notificationTime, setNotificationTime, checkAndScheduleWorkout } =
    useAppContext();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(notificationTime);
  const [isProcessing, setIsProcessing] = useState(false);

  const showPicker = useCallback(() => {
    if (!isProcessing) {
      setShowTimePicker(true);
    }
  }, [isProcessing]);

  const hidePicker = useCallback(() => {
    setShowTimePicker(false);
  }, []);

  const onChange = useCallback(
    async (event: any, selectedDate?: Date) => {
      if (isProcessing) return;

      // Immediately hide the picker for Android
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }

      if (event.type === "set" && selectedDate) {
        setIsProcessing(true);

        const newTime = {
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
        };

        setTempTime(newTime);

        // For Android, update immediately
        if (Platform.OS === "android") {
          try {
            await setNotificationTime(newTime);
          } catch (error) {
            console.error("Error setting notification time:", error);
          }
        }

        setIsProcessing(false);
      } else {
        hidePicker();
      }
    },
    [hidePicker, setNotificationTime, isProcessing]
  );

  const confirmTime = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Only update if the time has actually changed
      if (
        tempTime.hour !== notificationTime.hour ||
        tempTime.minute !== notificationTime.minute
      ) {
        await setNotificationTime(tempTime);
      }
    } catch (error) {
      console.error("Error confirming time:", error);
    } finally {
      setIsProcessing(false);
      hidePicker();
    }
  }, [
    tempTime,
    notificationTime,
    setNotificationTime,
    hidePicker,
    isProcessing,
  ]);

  const notificationDate = new Date();
  notificationDate.setHours(
    tempTime?.hour ?? notificationTime.hour,
    tempTime?.minute ?? notificationTime.minute
  );

  const formatTime = useCallback((time: { hour: number; minute: number }) => {
    let hours = time.hour;
    const minutes = time.minute.toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, "0");
    return `${formattedHours}:${minutes} ${ampm}`;
  }, []);

  const formattedTime = formatTime(notificationTime);

  const renderIOSPicker = useCallback(
    () => (
      <Modal
        transparent={true}
        visible={showTimePicker}
        animationType="slide"
        onRequestClose={hidePicker}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={hidePicker}
          className="flex-1 bg-black/30"
        >
          <View className="flex-1 justify-end">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                className={`${
                  colorScheme === "dark" ? "bg-gray-800" : "bg-white"
                } p-4 rounded-t-3xl`}
              >
                <DateTimePicker
                  testID="dateTimePicker"
                  value={notificationDate}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={onChange}
                  textColor={colors.text}
                />
                <View className="flex-row justify-between mt-4">
                  <TouchableOpacity
                    onPress={hidePicker}
                    className="p-2"
                    disabled={isProcessing}
                  >
                    <Text className="text-red-500 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmTime}
                    className="p-2"
                    disabled={isProcessing}
                  >
                    <Text
                      className={`text-blue-500 font-semibold ${
                        isProcessing ? "opacity-50" : ""
                      }`}
                    >
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    ),
    [
      showTimePicker,
      colorScheme,
      notificationDate,
      onChange,
      hidePicker,
      confirmTime,
      colors.text,
      isProcessing,
    ]
  );

  return (
    <View
      className={`flex-1 ${
        colorScheme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <View className="flex-1 px-6 justify-center items-center">
        <View
          className={`${
            colorScheme === "dark" ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-lg p-6 w-full mb-6`}
        >
          <Text
            className={`text-xl font-semibold mb-2 ${
              colorScheme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Notification Time
          </Text>
          <Text
            className={`text-5xl font-bold ${
              colorScheme === "dark" ? "text-blue-400" : "text-blue-500"
            } mb-4`}
          >
            {formattedTime}
          </Text>
          <TouchableOpacity
            onPress={showPicker}
            disabled={isProcessing}
            className={`${
              colorScheme === "dark" ? "bg-blue-600" : "bg-blue-500"
            } py-3 px-6 rounded-full flex-row items-center justify-center ${
              isProcessing ? "opacity-50" : ""
            }`}
            accessibilityLabel="Change notification time"
          >
            <Feather
              name="clock"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-center font-semibold text-lg">
              Change Time
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={checkAndScheduleWorkout}
          disabled={isProcessing}
          className={`${
            colorScheme === "dark" ? "bg-green-600" : "bg-green-500"
          } py-4 px-6 rounded-full w-full flex-row items-center justify-center ${
            isProcessing ? "opacity-50" : ""
          }`}
          accessibilityLabel="Check and schedule workout"
        >
          <Feather
            name="check-circle"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
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
              textColor={colors.text}
            />
          )}
    </View>
  );
}
