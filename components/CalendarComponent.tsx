import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  useColorScheme as useNativeColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "@/context/AppContext";
import {
  TasksState,
  WorkoutStatus,
  MarkedDates,
  DayProps,
} from "../utils/calendarTypes";
import { getBackgroundColor, getTextColor } from "@/utils/calendarUtils";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

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
  const nativeColorScheme = useNativeColorScheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [hasInteractedToday, setHasInteractedToday] = useState<boolean>(false);
  const { tasks, setTasks, workoutStatus, setWorkoutStatus } = useAppContext();
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    if (nativeColorScheme) {
      setColorScheme(nativeColorScheme);
    }
  }, [nativeColorScheme, setColorScheme]);

  const checkUserInteractionForToday = useCallback(async () => {
    try {
      const interaction = await AsyncStorage.getItem(
        `interaction-${currentDate}`
      );
      setHasInteractedToday(interaction !== null);
    } catch (error) {
      console.error("Error checking interaction for today:", error);
    }
  }, [currentDate]);

  useEffect(() => {
    loadSavedData();
    setSelectedDate(currentDate);
  }, []);

  useEffect(() => {
    checkUserInteractionForToday();
  }, [checkUserInteractionForToday, currentDate, tasks, workoutStatus]);

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

  const handleDayPress = useCallback(
    (day: DateData) => {
      if (day.dateString === currentDate && !hasInteractedToday) {
        setSelectedDate(day.dateString);
        showWorkoutStatusAlert(day.dateString);
      }
    },
    [currentDate, hasInteractedToday]
  );

  const showWorkoutStatusAlert = useCallback(
    (date: string) => {
      if (!hasInteractedToday) {
        Alert.alert("Workout Status", "Did you complete your workout?", [
          {
            text: "Skip",
            onPress: () => updateWorkoutStatus(date, "skipped"),
            style: "cancel",
          },
          { text: "Done", onPress: () => updateWorkoutStatus(date, "done") },
        ]);
      }
    },
    [hasInteractedToday]
  );

  const updateWorkoutStatus = useCallback(
    async (date: string, status: WorkoutStatus) => {
      try {
        setWorkoutStatus((prevStatus) => {
          const newStatus = { ...prevStatus, [date]: status };
          AsyncStorage.setItem("workoutStatus", JSON.stringify(newStatus));
          return newStatus;
        });

        await AsyncStorage.setItem(`interaction-${currentDate}`, "true");
        setHasInteractedToday(true);

        if (status === "skipped") {
          await adjustSchedule(date);
        }
      } catch (error) {
        console.error("Error updating workout status:", error);
      }
    },
    [setWorkoutStatus, currentDate]
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
          className={`items-center justify-center border-[1px] 
            ${isDark ? "border-white" : "border-gray-300"}
            ${isToday ? "border-4 border-blue-500" : ""}
            ${isCurrentDay ? "opacity-100" : "opacity-60"}
          `}
          style={{
            backgroundColor,
            width: "100%",
            height: 130,
            marginBottom: 0,
            marginTop: 0,
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
          <Text
            className={`${
              isDark ? "text-white" : "text-black"
            } font-semibold text-center`}
            style={{ fontSize: 18 }}
          >
            {date.day}
          </Text>
          {task && (
            <Text
              className={`${
                isDark ? "text-white" : "text-black"
              } text-center w-full`}
              style={{ fontSize: 12 }}
              numberOfLines={2}
            >
              {task}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
  );

  return (
    <ScrollView className={isDark ? "bg-gray-900" : "bg-white"}>
      <View>
        <View className="mb-4 flex-row justify-between items-center">
          <Text
            className={`text-2xl font-bold ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Workout Calendar
          </Text>
          <TouchableOpacity
            className={`${
              isDark ? "bg-gray-700" : "bg-gray-200"
            } rounded-full p-2`}
            onPress={() => {
              setSelectedDate(currentDate);
              setCalendarKey((prevKey) => prevKey + 1);
            }}
            accessibilityLabel="Go to current month"
          >
            <Feather
              name="calendar"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>
        <Calendar
          key={calendarKey}
          markedDates={markedDates}
          current={currentDate}
          dayComponent={CustomDay}
          onDayPress={handleDayPress}
          initialDate={currentDate}
          theme={{
            "stylesheet.calendar.main": {
              week: {
                marginTop: 0,
                marginBottom: 0,
                flex: 1,
                flexDirection: "row",
              },
            },
            "stylesheet.calendar.header": {
              dayHeader: {
                color: isDark ? "white" : "black",
                fontSize: 12,
              },
              monthText: {
                color: isDark ? "white" : "black",
                fontSize: 18,
              },
            },
            calendarBackground: "transparent",
            textSectionTitleColor: isDark ? "white" : "black",
            todayTextColor: isDark ? "white" : "black",
            dayTextColor: isDark ? "white" : "black",
            textDisabledColor: isDark ? "#4a5568" : "#d1d5db",
            arrowColor: isDark ? "white" : "black",
          }}
        />
      </View>
    </ScrollView>
  );
}
