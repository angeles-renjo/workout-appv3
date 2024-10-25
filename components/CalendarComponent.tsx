import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from "react-native";
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
import { Colors } from "@/constants/Colors";

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [hasInteractedToday, setHasInteractedToday] = useState<boolean>(false);
  const { tasks, setTasks, workoutStatus, setWorkoutStatus } = useAppContext();
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    loadSavedData();
    setSelectedDate(currentDate);
  }, []);

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
          { text: "Cancel", style: "cancel" },
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
            ${colorScheme === "dark" ? "border-gray-700" : "border-gray-300"}
            ${isToday ? "border-4 border-blue-500" : ""}
            ${isCurrentDay ? "opacity-100" : "opacity-60"}
          `}
          style={{
            backgroundColor,
            width: "100%",
            height: 115,
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
            style={{ fontSize: 18, color: colors.text }}
            className="font-semibold text-center"
          >
            {date.day}
          </Text>
          {task && (
            <Text
              style={{ fontSize: 12, color: colors.text }}
              className="text-center w-full"
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
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View>
        <View className=" flex-row justify-between items-center p-4">
          <Text style={{ color: colors.text }} className="text-xl font-bold">
            Workout Calendar
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor:
                colorScheme === "dark" ? colors.icon : colors.background,
            }}
            className="rounded-full p-2"
            onPress={() => {
              setSelectedDate(currentDate);
              setCalendarKey((prevKey) => prevKey + 1);
            }}
            accessibilityLabel="Go to current month"
          >
            <Feather name="calendar" size={18} color={colors.text} />
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
                color: colors.text,
                fontSize: 12,
              },
              monthText: {
                color: colors.text,
                fontSize: 18,
              },
            },
            calendarBackground: "transparent",
            textSectionTitleColor: colors.text,
            todayTextColor: colors.tint,
            dayTextColor: colors.text,
            textDisabledColor: colorScheme === "dark" ? "#4a5568" : "#d1d5db",
            arrowColor: colors.text,
          }}
        />
      </View>
    </ScrollView>
  );
}
