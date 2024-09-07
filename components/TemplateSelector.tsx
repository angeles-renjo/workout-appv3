import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { supabase } from "@/utils/supabase";
import { Template } from "../utils/calendarTypes";
import { useAppContext } from "@/context/AppContext";

export default function TemplateSelectorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { applyTemplate } = useAppContext();

  useEffect(() => {
    fetchTemplates();
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

  const handleSelectTemplate = (template: Template) => {
    applyTemplate(template);
    // Navigate back to the calendar page or show a confirmation message
  };

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      className="bg-white p-4 mb-2 rounded-lg shadow"
      onPress={() => handleSelectTemplate(item)}
    >
      <Text className="text-lg font-bold">{item.name}</Text>
      <Text className="text-sm text-gray-600">{item.description}</Text>
      <Text className="text-xs text-gray-500 mt-1">
        {item.tasks.length} day program
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">Select a Workout Template</Text>
      <FlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
