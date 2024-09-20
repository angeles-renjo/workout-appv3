import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "@/context/AppContext";
import {
  TasksState,
  WorkoutStatus,
  MarkedDates,
  DayProps,
  DayContentProps,
} from "../utils/calendarTypes";
import { getBackgroundColor, getTextColor } from "@/utils/calendarUtils";
import { Feather } from "@expo/vector-icons";

const DayContent = React.memo(({ date, task, textColor }: DayContentProps) => (
  <View className="items-center justify-center w-full h-full">
    <Text
      className={`text-${textColor} font-semibold text-base sm:text-lg md:text-xl`}
    >
      {date.day}
    </Text>
    {task && (
      <Text
        className={`text-xs sm:text-sm md:text-base text-${textColor} text-center w-full mt-1`}
        numberOfLines={2}
      >
        {task}
      </Text>
    )}
  </View>
));

const shiftTasksAfterSkippedDate = (
  tasks: TasksState,
  skippedDate: string
): TasksState => {
  const updatedTasks = { ...tasks };
  const dates = Object.keys(updatedTasks).sort();
  const skippedIndex = dates.indexOf(skippedDate);

  if (skippedIndex !== -1 && skippedIndex < dates.length - 1) {
    const skippedWorkout = updatedTasks[skippedDate];
    for (let i = dates.length - 1; i > skippedIndex; i--) {
      updatedTasks[dates[i]] = updatedTasks[dates[i - 1]];
    }
    updatedTasks[dates[skippedIndex + 1]] = skippedWorkout;
  }

  return updatedTasks;
};

export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const { tasks, setTasks, workoutStatus, setWorkoutStatus } = useAppContext();
  const { width } = useWindowDimensions();

  const daySize = useMemo(() => {
    const baseSize = width / 7; // 7 days in a week
    return Math.max(baseSize, 50); // Ensure a minimum size of 50
  }, [width]);

  const CustomDay = React.memo(
    ({ date, state, marking, onPress }: DayProps) => {
      if (!date) return null;

      const isSelected = state === "selected";
      const isToday = state === "today";
      const isCurrentDay = date.dateString === currentDate;
      const { task, workoutStatus } = marking || {};

      const backgroundColor = getBackgroundColor(workoutStatus, isSelected);
      const textColor = getTextColor(isSelected, workoutStatus);

      return (
        <TouchableOpacity
          className={`items-center justify-center rounded-xl
          ${isToday ? "border-2 border-gray-800" : ""}
          ${isCurrentDay ? "opacity-100" : "opacity-50"}
        `}
          style={{
            backgroundColor,
            width: daySize,
            height: daySize,
            margin: 1,
          }}
          onPress={() => isCurrentDay && onPress?.(date)}
          disabled={!isCurrentDay}
          accessibilityLabel={`Select date ${date.dateString}`}
          accessibilityHint={
            isCurrentDay
              ? "Double tap to select this date"
              : "This date is not selectable"
          }
        >
          <DayContent date={date} task={task} textColor={textColor} />
        </TouchableOpacity>
      );
    }
  );

  useEffect(() => {
    loadSavedData();
    setSelectedDate(currentDate);
  }, []);

  const loadSavedData = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem("tasks");
      const savedWorkoutStatus = await AsyncStorage.getItem("workoutStatus");

      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedWorkoutStatus) setWorkoutStatus(JSON.parse(savedWorkoutStatus));
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  };

  const markedDates: MarkedDates = useMemo(() => {
    return Object.entries(tasks).reduce((acc, [date, taskList]) => {
      acc[date] = {
        task: taskList.map((t) => t.name).join(", "),
        workoutStatus: workoutStatus[date],
        ...(date === selectedDate ? { selected: true } : {}),
      };
      return acc;
    }, {} as MarkedDates);
  }, [tasks, workoutStatus, selectedDate]);

  const handleDayPress = useCallback(
    (day: DateData) => {
      if (day.dateString === currentDate) {
        setSelectedDate(day.dateString);
        showWorkoutStatusAlert(day.dateString);
      }
    },
    [currentDate]
  );

  const showWorkoutStatusAlert = useCallback((date: string) => {
    Alert.alert("Workout Status", "Did you complete your workout?", [
      {
        text: "Skip",
        onPress: () => updateWorkoutStatus(date, "skipped"),
        style: "cancel",
      },
      { text: "Done", onPress: () => updateWorkoutStatus(date, "done") },
    ]);
  }, []);

  const updateWorkoutStatus = useCallback(
    async (date: string, status: WorkoutStatus) => {
      try {
        setWorkoutStatus((prevStatus) => {
          const newStatus = { ...prevStatus, [date]: status };
          AsyncStorage.setItem("workoutStatus", JSON.stringify(newStatus));
          return newStatus;
        });

        if (status === "skipped") {
          await adjustSchedule(date);
        }
      } catch (error) {
        console.error("Error updating workout status:", error);
      }
    },
    [setWorkoutStatus]
  );

  const adjustSchedule = useCallback(
    async (skippedDate: string) => {
      try {
        setTasks((prevTasks) => {
          const updatedTasks = shiftTasksAfterSkippedDate(
            prevTasks,
            skippedDate
          );
          AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
          return updatedTasks;
        });
      } catch (error) {
        console.error("Error adjusting schedule:", error);
      }
    },
    [setTasks]
  );

  const goToCurrentMonth = () => {
    setSelectedDate(currentDate);
    setCalendarKey((prevKey) => prevKey + 1);
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-4 sm:p-6 md:p-8 lg:p-10">
        <View className="mb-6 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Workout Calendar
          </Text>
          <TouchableOpacity
            className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            onPress={goToCurrentMonth}
            accessibilityLabel="Go to current month"
          >
            <Feather name="calendar" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <Calendar
          markedDates={markedDates}
          key={calendarKey}
          current={currentDate}
          dayComponent={CustomDay}
          onDayPress={handleDayPress}
          initialDate={currentDate}
          className="rounded-lg shadow-lg overflow-hidden"
          theme={{
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#b6c1cd",
            selectedDayBackgroundColor: "#000000",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#000000",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            dotColor: "#000000",
            selectedDotColor: "#ffffff",
            arrowColor: "black",
            monthTextColor: "black",
            indicatorColor: "black",
            textDayFontFamily: "System",
            textMonthFontFamily: "System",
            textDayHeaderFontFamily: "System",
            textDayFontWeight: "400",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />

        <View className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Today's Workout: {currentDate}
          </Text>
          <View className="flex-row justify-around">
            <TouchableOpacity
              className="bg-gray-800 dark:bg-gray-200 py-3 px-6 rounded-full"
              onPress={() => updateWorkoutStatus(currentDate, "done")}
              accessibilityLabel="Mark workout as done"
            >
              <Text className="text-white dark:text-gray-800 font-semibold text-lg">
                Done
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-300 dark:bg-gray-600 py-3 px-6 rounded-full"
              onPress={() => updateWorkoutStatus(currentDate, "skipped")}
              accessibilityLabel="Mark workout as skipped"
            >
              <Text className="text-gray-800 dark:text-gray-200 font-semibold text-lg">
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
