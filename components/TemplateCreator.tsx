import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Template } from "../utils/calendarTypes";
import { useRouter } from "expo-router";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [tasks, setTasks] = useState<Template["tasks"]>([
    { day: 1, exercise: "" },
  ]);

  const addTask = () => {
    const nextDay = tasks.length + 1;
    setTasks([...tasks, { day: nextDay, exercise: "" }]);
  };

  const updateTask = (index: number, exercise: string) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], exercise };
    setTasks(updatedTasks);
  };

  const removeTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
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
    <View>
      <Text>Create Workout Template</Text>

      <TextInput
        placeholder="Template Name"
        value={templateName}
        onChangeText={setTemplateName}
      />

      <TextInput
        placeholder="Template Description"
        value={templateDescription}
        onChangeText={setTemplateDescription}
        multiline
      />

      {tasks.map((task, index) => (
        <View key={index}>
          <TextInput
            placeholder="Exercise"
            value={task.exercise}
            onChangeText={(text) => updateTask(index, text)}
          />
          <Text>Day {task.day}</Text>
          <TouchableOpacity onPress={() => removeTask(index)}>
            <Text>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addTask}>
        <Text>Add Exercise</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={saveTemplate}>
        <Text>Save Template</Text>
      </TouchableOpacity>
    </View>
  );
}
