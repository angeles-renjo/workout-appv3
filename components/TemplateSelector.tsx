import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { Template } from "../utils/calendarTypes";
import { useAppContext } from "@/context/AppContext";
import { Link, useRouter } from "expo-router";

export default function TemplateSelectorPage() {
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>(
    []
  );
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const { applyTemplate } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    fetchPredefinedTemplates();
    loadUserTemplates();
  }, []);

  const fetchPredefinedTemplates = async () => {
    const { data, error } = await supabase
      .from("workout_templates")
      .select("*");

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setPredefinedTemplates(data as Template[]);
    }
  };

  const loadUserTemplates = async () => {
    try {
      const templatesJson = await AsyncStorage.getItem("userTemplates");
      if (templatesJson) {
        setUserTemplates(JSON.parse(templatesJson));
      }
    } catch (error) {
      console.error("Error loading user templates:", error);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    applyTemplate(template);
    router.back();
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
      <Text className="text-xl font-bold mb-4">Workout Templates</Text>

      <Text className="text-lg font-semibold mt-4 mb-2">
        Predefined Workouts
      </Text>
      <FlatList
        data={predefinedTemplates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id.toString()}
      />

      <Text className="text-lg font-semibold mt-4 mb-2">Created Workouts</Text>
      <FlatList
        data={userTemplates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text className="text-gray-500">No created workouts yet</Text>
        }
      />

      <Link href="/test" asChild>
        <TouchableOpacity className="bg-blue-500 p-3 rounded mt-4">
          <Text className="text-white text-center font-semibold">
            Create New Template
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
