import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Alert, TouchableOpacity, FlatList } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase"; // Adjust the import path as needed
import {
  Task,
  TasksState,
  WorkoutStatus,
  WorkoutStatusState,
  MarkedDates,
  DayProps,
  Template,
  DayContentProps,
} from "../utils/calendarTypes";
import {
  generateYearlyTasks,
  getBackgroundColor,
  getTextColor,
} from "@/utils/calendarUtils";

import { useAppContext } from "@/context/AppContext";
// Utility functions (you might want to move these to a separate file)

// Component definitions
function DayContent({ date, task, textColor }: DayContentProps) {
  return (
    <>
      <Text className={`text-${textColor}`}>{date.day}</Text>
      {task && (
        <Text className={`text-xs text-${textColor} text-center w-full`}>
          {task}
        </Text>
      )}
    </>
  );
}

const MemoizedDayContent = React.memo(DayContent);

function CustomDay({ date, state, marking, onPress }: DayProps) {
  if (!date) return null;

  const isSelected = state === "selected";
  const isToday = state === "today";
  const { task, workoutStatus } = marking || {};

  const backgroundColor = getBackgroundColor(
    workoutStatus || undefined,
    isSelected
  );
  const textColor = getTextColor(isSelected, workoutStatus);

  return (
    <TouchableOpacity
      className={`items-center justify-center ${
        isToday ? "border border-blue-500" : ""
      }`}
      style={{ backgroundColor }}
      onPress={() => onPress?.(date)}
    >
      <MemoizedDayContent date={date} task={task} textColor={textColor} />
    </TouchableOpacity>
  );
}

const MemoizedCustomDay = React.memo(CustomDay);

function TemplateSelector({
  onSelectTemplate,
}: {
  onSelectTemplate: (template: Template) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetchTemplates();
    console.log("templates", templates);
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("workout_templates")
      .select("*");

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates(data as Template[]);
    }
  };

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      className="bg-white p-4 mb-2 rounded-lg shadow"
      onPress={() => onSelectTemplate(item)}
    >
      <Text className="text-lg font-bold">{item.name}</Text>
      <Text className="text-sm text-gray-600">{item.description}</Text>
      <Text className="text-xs text-gray-500 mt-1">
        {item.tasks.length} day program
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="mt-4">
      <Text className="text-xl font-bold mb-2">Select a Workout Template</Text>
      <FlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { tasks, setTasks, workoutStatus, setWorkoutStatus } = useAppContext();

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem("tasks");
        const savedWorkoutStatus = await AsyncStorage.getItem("workoutStatus");

        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedWorkoutStatus)
          setWorkoutStatus(JSON.parse(savedWorkoutStatus));
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  const markedDates: MarkedDates = useMemo(() => {
    return Object.entries(tasks).reduce((acc, [date, taskList]) => {
      acc[date] = {
        task: taskList.map((t) => t.name).join(", "),
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
          const updatedTasks = { ...prevTasks };
          const dates = Object.keys(updatedTasks).sort();
          const skippedIndex = dates.indexOf(skippedDate);

          if (skippedIndex !== -1 && skippedIndex < dates.length - 1) {
            const skippedWorkout = updatedTasks[skippedDate];

            for (let i = dates.length - 1; i > skippedIndex; i--) {
              updatedTasks[dates[i]] = updatedTasks[dates[i - 1]];
            }

            updatedTasks[dates[skippedIndex + 1]] = skippedWorkout;
          }

          AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
          return updatedTasks;
        });
      } catch (error) {
        console.error("Error adjusting schedule:", error);
      }
    },
    [setTasks]
  );

  return (
    <View className="">
      <Calendar
        markedDates={markedDates}
        dayComponent={MemoizedCustomDay}
        onDayPress={handleDayPress}
        className="h-[350px] mt-4"
      />
    </View>
  );
}
