import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { supabase } from "@/utils/supabase"; // Adjust the import path as needed

type Template = {
  id: number;
  name: string;
  description: string;
  tasks: {
    day: number;
    exercise: string;
  }[];
};

type TemplateSelectorProps = {
  onSelectTemplate: (template: Template) => void;
};

export default function TemplateSelector({
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);

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

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      className=" p-10 mb-2 rounded-lg shadow max=w-[250px]"
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
    <View>
      <Text className="flex text-xl font-bold mb-2">
        Select a Workout Template
      </Text>
      <FlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
