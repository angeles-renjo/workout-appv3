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

// Utility functions (you might want to move these to a separate file)
const getBackgroundColor = (
  workoutStatus: WorkoutStatus,
  isSelected: boolean
): string => {
  if (isSelected) return "blue";
  switch (workoutStatus) {
    case "done":
      return "green";
    case "skipped":
      return "red";
    default:
      return "transparent";
  }
};

const getTextColor = (
  isSelected: boolean,
  workoutStatus: WorkoutStatus
): string => {
  if (isSelected || workoutStatus) return "white";
  return "black";
};

const generateYearlyTasks = (): TasksState => {
  // Implement this function based on your requirements
  return {};
};

// Component definitions
function DayContent({ date, task, textColor }: DayContentProps) {
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
      className={`items-center justify-center w-8 h-8 rounded-full ${
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

// Main CalendarComponent
export default function CalendarComponent() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tasks, setTasks] = useState<TasksState>({});
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatusState>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem("tasks");
      const storedWorkoutStatus = await AsyncStorage.getItem("workoutStatus");

      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        const yearlyTasks = generateYearlyTasks();
        setTasks(yearlyTasks);
        await AsyncStorage.setItem("tasks", JSON.stringify(yearlyTasks));
      }

      if (storedWorkoutStatus) {
        setWorkoutStatus(JSON.parse(storedWorkoutStatus));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const saveWorkoutStatus = async (newWorkoutStatus: WorkoutStatusState) => {
    try {
      await AsyncStorage.setItem(
        "workoutStatus",
        JSON.stringify(newWorkoutStatus)
      );
    } catch (error) {
      console.error("Error saving workout status:", error);
    }
  };

  const saveTasks = async (newTasks: TasksState) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

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
      setWorkoutStatus((prevStatus) => {
        const newStatus = {
          ...prevStatus,
          [date]: status,
        };
        saveWorkoutStatus(newStatus);
        return newStatus;
      });

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

      saveTasks(updatedTasks);
      return updatedTasks;
    });
  }, []);

  const handleTemplateSelection = useCallback((template: Template) => {
    const today = new Date();
    const newTasks: TasksState = {};

    for (let i = 0; i < 52; i++) {
      // Generate tasks for a year
      template.tasks.forEach((task) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i * 7 + task.day - 1); // Subtract 1 because day is 1-indexed
        const dateString = date.toISOString().split("T")[0];

        newTasks[dateString] = [
          {
            name: task.exercise,
            completed: false,
          },
        ];
      });
    }

    setTasks(newTasks);
    saveTasks(newTasks);
    Alert.alert(
      "Template Applied",
      `The "${template.name}" template has been applied to your calendar.`
    );
  }, []);

  return (
    <View className="flex-1  p-4 w-full">
      <Text className=" text-4xl"> hi </Text>
      <TemplateSelector onSelectTemplate={handleTemplateSelection} />
      <Calendar
        markedDates={markedDates}
        dayComponent={MemoizedCustomDay}
        onDayPress={handleDayPress}
        className="h-[350px] mt-4"
      />
    </View>
  );
}
