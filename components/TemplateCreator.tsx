import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "@/utils/supabase";
import { Template, Task } from "../utils/calendarTypes";

export default function TemplateCreator() {
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([{ day: 1, exercise: "" }]);

  const addTask = () => {
    setTasks([...tasks, { day: 1, exercise: "" }]);
  };

  const updateTask = (
    index: number,
    field: keyof Task,
    value: string | number
  ) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setTasks(updatedTasks);
  };

  const removeTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const saveTemplate = async () => {
    if (!templateName || tasks.some((task) => !task.exercise)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const newTemplate: Template = {
      id: Date.now(), // This will be replaced by the database
      name: templateName,
      description: templateDescription,
      tasks: tasks,
    };

    try {
      const { data, error } = await supabase
        .from("workout_templates")
        .insert(newTemplate);

      if (error) throw error;

      Alert.alert("Success", "Template saved successfully");
      // Reset form or navigate back
    } catch (error) {
      console.error("Error saving template:", error);
      Alert.alert("Error", "Failed to save template");
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">Create Workout Template</Text>

      <TextInput
        className="border border-gray-300 rounded p-2 mb-4"
        placeholder="Template Name"
        value={templateName}
        onChangeText={setTemplateName}
      />

      <TextInput
        className="border border-gray-300 rounded p-2 mb-4"
        placeholder="Template Description"
        value={templateDescription}
        onChangeText={setTemplateDescription}
        multiline
      />

      {tasks.map((task, index) => (
        <View key={index} className="flex-row items-center mb-4">
          <Picker
            selectedValue={task.day}
            style={{ height: 50, width: 100 }}
            onValueChange={(itemValue) => updateTask(index, "day", itemValue)}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <Picker.Item key={day} label={`Day ${day}`} value={day} />
            ))}
          </Picker>

          <TextInput
            className="flex-1 border border-gray-300 rounded p-2 mx-2"
            placeholder="Exercise"
            value={task.exercise}
            onChangeText={(text) => updateTask(index, "exercise", text)}
          />

          <TouchableOpacity onPress={() => removeTask(index)}>
            <Text className="text-red-500">Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        className="bg-blue-500 p-2 rounded mb-4"
        onPress={addTask}
      >
        <Text className="text-white text-center">Add Task</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-green-500 p-2 rounded"
        onPress={saveTemplate}
      >
        <Text className="text-white text-center">Save Template</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
