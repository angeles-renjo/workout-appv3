import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { Template } from "../utils/calendarTypes";
import { useAppContext } from "@/context/AppContext";
import { Link, useRouter, useFocusEffect } from "expo-router";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { useWorkoutNotification } from "@/hooks/useWorkoutNotification";

export default function TemplateSelectorPage() {
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>(
    []
  );
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { applyTemplate } = useAppContext();
  const [isApplying, setIsApplying] = useState(false);

  const router = useRouter();

  // Use the workout notification hook
  useWorkoutNotification();

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
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPredefinedTemplates(), loadUserTemplates()]);
      // Ensure the loader is shown for at least 1 second
      setTimeout(() => setIsLoading(false), 1000);
    };
    loadData();
  }, [loadUserTemplates]);

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
          onPress: async () => {
            setIsApplying(true);
            // Simulate a delay to ensure the loader is visible
            await new Promise((resolve) => setTimeout(resolve, 1000));
            applyTemplate(template);
            setIsApplying(false);
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">Workout Templates</Text>

      {/* Predefined Workouts */}
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

      {/* Created Workouts */}
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

      {/* Applying Template Loader */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isApplying}
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={{ marginTop: 10 }}>Applying template...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
