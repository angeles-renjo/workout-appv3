import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

interface Task {
  id: number;
  day: number;
  exercise: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  tasks: Task[];
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([{ id: 1, day: 1, exercise: "" }]);
  const [nextId, setNextId] = useState(2);

  const addTask = () => {
    const nextDay = tasks.length + 1;
    setTasks([...tasks, { id: nextId, day: nextDay, exercise: "" }]);
    setNextId(nextId + 1);
  };

  const updateTask = (id: number, exercise: string) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, exercise } : task))
    );
  };

  const removeTask = (id: number) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    const reorderedTasks = updatedTasks.map((task, i) => ({
      ...task,
      day: i + 1,
    }));
    setTasks(reorderedTasks);
  };

  const saveTemplate = async () => {
    if (!templateName || tasks.some((task) => !task.exercise)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const newTemplate: Template = {
      id: Date.now(),
      name: templateName,
      description: templateDescription,
      tasks: tasks,
    };

    try {
      const existingTemplatesJson = await AsyncStorage.getItem("userTemplates");
      let existingTemplates: Template[] = existingTemplatesJson
        ? JSON.parse(existingTemplatesJson)
        : [];

      existingTemplates.push(newTemplate);

      await AsyncStorage.setItem(
        "userTemplates",
        JSON.stringify(existingTemplates)
      );

      Alert.alert("Success", "Template saved successfully");
      router.back();
    } catch (error) {
      console.error("Error saving template:", error);
      Alert.alert("Error", "Failed to save template");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-100 dark:bg-gray-900"
    >
      <StatusBar style="auto" />
      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Create Workout Template
        </Text>

        <View className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <TextInput
            className="text-lg mb-2 p-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
            placeholder="Template Name"
            placeholderTextColor="#9CA3AF"
            value={templateName}
            onChangeText={setTemplateName}
          />

          <TextInput
            className="text-base p-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
            placeholder="Template Description"
            placeholderTextColor="#9CA3AF"
            value={templateDescription}
            onChangeText={setTemplateDescription}
            multiline
          />
        </View>

        {tasks.map((task) => (
          <View
            key={task.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 flex-row items-center"
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">
                Day {task.day}
              </Text>
              <TextInput
                className="text-base p-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                placeholder="Exercise"
                placeholderTextColor="#9CA3AF"
                value={task.exercise}
                onChangeText={(text) => updateTask(task.id, text)}
              />
            </View>
            <TouchableOpacity
              onPress={() => removeTask(task.id)}
              className="ml-4 p-2 bg-red-500 rounded-full"
            >
              <Feather name="trash-2" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={addTask}
          className="bg-blue-500 dark:bg-blue-600 p-3 rounded-lg mb-4 flex-row justify-center items-center"
        >
          <Feather name="plus" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveTemplate}
          className="bg-green-500 dark:bg-green-600 p-4 rounded-lg mb-4"
        >
          <Text className="text-white font-bold text-center text-lg">
            Save Template
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
