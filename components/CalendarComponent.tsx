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
} from "../utils/calendarTypes";
import { getBackgroundColor, getTextColor } from "@/utils/calendarUtils";
import { Feather } from "@expo/vector-icons";

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
  const [hasInteractedToday, setHasInteractedToday] = useState<boolean>(false);
  const { tasks, setTasks, workoutStatus, setWorkoutStatus } = useAppContext();
  const [calendarKey, setCalendarKey] = useState(0);

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
          className={`items-center justify-center  border-2 dark:border-white 
            ${isToday ? "border-2 border-blue-300" : ""}
            ${isCurrentDay ? "opacity-100" : "opacity-60"}
            `}
          style={{
            backgroundColor,
            width: "100%", // Fixed width
            height: 130, // Fixed height
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
            className={`dark:text-white font-semibold text-center`}
            style={{ fontSize: 18 }} // Fixed font size
          >
            {date.day}
          </Text>
          {task && (
            <Text
              className={`dark:text-white text-center w-full `}
              style={{ fontSize: 12 }} // Fixed font size
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
    <ScrollView>
      <View className="">
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Workout Calendar
          </Text>
          <TouchableOpacity
            className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            onPress={() => {
              setSelectedDate(currentDate);
              setCalendarKey((prevKey) => prevKey + 1); // This will force a re-render
            }}
            accessibilityLabel="Go to current month"
          >
            <Feather name="calendar" size={24} color="black" />
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
            calendarBackground: "transparent",
          }}
        />
      </View>
    </ScrollView>
  );
}
