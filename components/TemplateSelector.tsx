import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { Template } from "../utils/calendarTypes";
import { useAppContext } from "@/context/AppContext";
import { Link, useRouter, useFocusEffect } from "expo-router";
import EvilIcons from "@expo/vector-icons/EvilIcons";

export default function TemplateSelectorPage() {
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>(
    []
  );
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const { applyTemplate } = useAppContext();
  const router = useRouter();

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

  const loadUserTemplates = useCallback(async () => {
    try {
      const templatesJson = await AsyncStorage.getItem("userTemplates");
      if (templatesJson) {
        setUserTemplates(JSON.parse(templatesJson));
      }
    } catch (error) {
      console.error("Error loading user templates:", error);
    }
  }, []);

  useEffect(() => {
    fetchPredefinedTemplates();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserTemplates();
    }, [loadUserTemplates])
  );

  const handleSelectTemplate = (template: Template) => {
    Alert.alert(
      "Apply Template",
      `Are you sure you want to apply the "${template.name}" template? This will overwrite your current workout plan.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Apply",
          onPress: () => {
            applyTemplate(template);
            Alert.alert("Success", "Template applied successfully");
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteTemplate = async (templateId: number) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            const updatedTemplates = userTemplates.filter(
              (t) => t.id !== templateId
            );
            setUserTemplates(updatedTemplates);
            try {
              await AsyncStorage.setItem(
                "userTemplates",
                JSON.stringify(updatedTemplates)
              );
            } catch (error) {
              console.error("Error saving updated templates:", error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderTemplateItem = ({
    item,
    isUserTemplate,
  }: {
    item: Template;
    isUserTemplate: boolean;
  }) => (
    <View className="bg-white p-4 mb-2 rounded-lg shadow flex-row justify-between items-center">
      <TouchableOpacity
        onPress={() => handleSelectTemplate(item)}
        className="flex-1"
      >
        <Text className="text-lg font-bold">{item.name}</Text>
        <Text className="text-sm text-gray-600">{item.description}</Text>
        <Text className="text-xs text-gray-500 mt-1">
          {item.tasks.length} day program
        </Text>
      </TouchableOpacity>
      {isUserTemplate && (
        <TouchableOpacity
          onPress={() => handleDeleteTemplate(item.id)}
          className="ml-2"
        >
          <EvilIcons name="trash" color="red" size={24} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">Workout Templates</Text>

      <Text className="text-lg font-semibold mt-4 mb-2">
        Predefined Workouts
      </Text>
      <FlatList
        data={predefinedTemplates}
        renderItem={({ item }) =>
          renderTemplateItem({ item, isUserTemplate: false })
        }
        keyExtractor={(item) => item.id.toString()}
      />

      <Text className="text-lg font-semibold mt-4 mb-2">Created Workouts</Text>
      <FlatList
        data={userTemplates}
        renderItem={({ item }) =>
          renderTemplateItem({ item, isUserTemplate: true })
        }
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text className="text-gray-500">No created workouts yet</Text>
        }
      />

      <Link href="/templateForm" asChild>
        <TouchableOpacity className="bg-blue-500 p-3 rounded mt-4">
          <Text className="text-white text-center font-semibold">
            Create New Template
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
