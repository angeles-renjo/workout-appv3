import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Alert, TouchableOpacity, Button } from "react-native";
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

// Extracted DayContent component
const DayContent = React.memo(({ date, task, textColor }: DayContentProps) => (
  <>
    <Text className={`text-${textColor}`}>{date.day}</Text>
    {task && (
      <Text className={`text-xs text-${textColor} text-center w-full`}>
        {task}
      </Text>
    )}
  </>
));

// Extracted CustomDay component
const CustomDay = React.memo(({ date, state, marking, onPress }: DayProps) => {
  if (!date) return null;

  const isSelected = state === "selected";
  const isToday = state === "today";
  const { task, workoutStatus } = marking || {};

  const backgroundColor = getBackgroundColor(workoutStatus, isSelected);
  const textColor = getTextColor(isSelected, workoutStatus);

  return (
    <TouchableOpacity
      className={`items-center justify-center ${
        isToday ? "border border-blue-500" : ""
      }`}
      style={{ backgroundColor }}
      onPress={() => onPress?.(date)}
    >
      <DayContent date={date} task={task} textColor={textColor} />
    </TouchableOpacity>
  );
});

// Helper function to shift tasks
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

// Main CalendarComponent
export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  ); // Store today's date
  const [calendarKey, setCalendarKey] = useState<number>(0); // Key to force re-render
  const { tasks, setTasks, workoutStatus, setWorkoutStatus } = useAppContext();

  useEffect(() => {
    loadSavedData();
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

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
    showWorkoutStatusAlert(day.dateString);
  }, []);

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

  // Button to go to current month
  const goToCurrentMonth = () => {
    setSelectedDate(currentDate); // Set selected date to today
    setCalendarKey((prevKey) => prevKey + 1); // Increment key to force re-render
  };

  return (
    <View className="">
      <Calendar
        markedDates={markedDates}
        key={calendarKey} // Use key to trigger re-render when it changes
        current={currentDate}
        dayComponent={CustomDay}
        onDayPress={handleDayPress}
        initialDate={selectedDate || currentDate} // Use initialDate to jump to today
        className="h-[350px] mt-4"
      />
      <Button title="Go to Current Month" onPress={goToCurrentMonth} />
    </View>
  );
}
