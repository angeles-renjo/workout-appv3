import React, { useState, useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import {
  TasksState,
  WorkoutStatusState,
  MarkedDates,
  DayProps,
  WorkoutStatus,
} from "../utils/calendarTypes";
import {
  generateMonthlyTasks,
  getBackgroundColor,
  getTextColor,
} from "../utils/calendarUtils";

function DayContent({
  date,
  task,
  textColor,
}: {
  date: DateData;
  task?: string;
  textColor: string;
}) {
  return (
    <>
      <Text className={`text-${textColor}`}>{date.day}</Text>
      {task && (
        <Text
          className={`text-xs text-${textColor} absolute bottom-0 text-center w-full`}
        >
          {task}
        </Text>
      )}
    </>
  );
}

function CustomDay({
  date,
  state,
  marking,
  onPress,
}: DayProps): React.JSX.Element | null {
  if (!date) return null;

  const isSelected = state === "selected";
  const isToday = state === "today";
  const { task, workoutStatus } = marking || {};

  const backgroundColor = getBackgroundColor(workoutStatus || null, isSelected);
  const textColor = getTextColor(isSelected, workoutStatus);

  return (
    <View
      className={`items-center justify-center w-8 h-8 rounded-full ${
        isToday ? "border border-blue-500" : ""
      }`}
      style={{ backgroundColor }}
      onTouchEnd={() => onPress?.(date)}
    >
      <DayContent date={date} task={task} textColor={textColor} />
    </View>
  );
}

export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tasks, setTasks] = useState<TasksState>({});
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatusState>({});

  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const monthlyTasks = generateMonthlyTasks(currentYear, currentMonth);
    setTasks(monthlyTasks);
  }, []);

  const markedDates: MarkedDates = Object.entries(tasks).reduce(
    (acc, [date, taskList]) => {
      acc[date] = {
        task: taskList.map((t) => t.name).join(", "),
        workoutStatus: workoutStatus[date] || undefined,
        ...(date === selectedDate ? { selected: true } : {}),
      };
      return acc;
    },
    {} as MarkedDates
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    showWorkoutStatusAlert(day.dateString);
  };

  const showWorkoutStatusAlert = (date: string) => {
    Alert.alert("Workout Status", "Did you complete your workout?", [
      {
        text: "Skip",
        onPress: () => updateWorkoutStatus(date, "skipped"),
        style: "cancel",
      },
      { text: "Done", onPress: () => updateWorkoutStatus(date, "done") },
    ]);
  };

  const updateWorkoutStatus = (date: string, status: WorkoutStatus) => {
    setWorkoutStatus((prevStatus) => ({
      ...prevStatus,
      [date]: status,
    }));
  };

  return (
    <View className="flex-1 p-4">
      <Calendar
        markedDates={markedDates}
        dayComponent={CustomDay}
        onDayPress={handleDayPress}
        className="h-[350px]"
      />
    </View>
  );
}
