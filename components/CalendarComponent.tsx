import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Alert } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import {
  TasksState,
  WorkoutStatusState,
  MarkedDates,
  DayProps,
  WorkoutStatus,
  Task,
} from "../utils/calendarTypes";
import {
  generateYearlyTasks,
  getBackgroundColor,
  getTextColor,
} from "../utils/calendarUtils";

type DayContentProps = {
  date: DateData;
  task?: string;
  textColor: string;
};

const DayContent = React.memo(({ date, task, textColor }: DayContentProps) => (
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
));

const CustomDay = React.memo(({ date, state, marking, onPress }: DayProps) => {
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
});

export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tasks, setTasks] = useState<TasksState>({});
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatusState>({});

  useEffect(() => {
    const yearlyTasks = generateYearlyTasks();
    setTasks(yearlyTasks);
  }, []);

  const markedDates: MarkedDates = useMemo(() => {
    return Object.entries(tasks).reduce((acc, [date, taskList]) => {
      acc[date] = {
        task: taskList.map((t: Task) => t.name).join(", "),
        workoutStatus: workoutStatus[date] || undefined,
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
    (date: string, status: WorkoutStatus) => {
      setWorkoutStatus((prevStatus) => ({
        ...prevStatus,
        [date]: status,
      }));

      if (status === "skipped") {
        adjustSchedule(date);
      }
    },
    []
  );

  const adjustSchedule = useCallback((skippedDate: string) => {
    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      const dates = Object.keys(updatedTasks).sort();
      const skippedIndex = dates.indexOf(skippedDate);

      if (skippedIndex !== -1 && skippedIndex < dates.length - 1) {
        const skippedWorkout = updatedTasks[skippedDate];

        // Shift workouts starting from the day after the skipped date
        for (let i = dates.length - 1; i > skippedIndex; i--) {
          updatedTasks[dates[i]] = updatedTasks[dates[i - 1]];
        }

        // Insert the skipped workout into the next day
        updatedTasks[dates[skippedIndex + 1]] = skippedWorkout;
      }

      return updatedTasks;
    });
  }, []);

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
