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
import { EvilIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TemplateSelectorPage() {
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>(
    []
  );
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { applyTemplate } = useAppContext();
  const [isApplying, setIsApplying] = useState(false);
  const router = useRouter();
  const { colorScheme } = useColorScheme();

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
      `Are you sure you want to apply the "${template.name}" template? This will overwrite your current workout plan and reset all interactions.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Apply",
          onPress: async () => {
            setIsApplying(true);
            try {
              await applyTemplate(template);
              Alert.alert("Success", "Template applied successfully");
            } catch (error) {
              console.error("Error applying template:", error);
              Alert.alert(
                "Error",
                "Failed to apply template. Please try again."
              );
            } finally {
              setIsApplying(false);
              router.back();
            }
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
    <View className="bg-white dark:bg-gray-800 p-4 mb-2 rounded-lg shadow-md">
      <TouchableOpacity
        onPress={() => handleSelectTemplate(item)}
        className="flex-row justify-between items-center"
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 dark:text-white">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {item.description}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {item.tasks.length} day program
          </Text>
        </View>
        {isUserTemplate && (
          <TouchableOpacity
            onPress={() => handleDeleteTemplate(item.id)}
            className="ml-2 p-2"
          >
            <EvilIcons
              name="trash"
              color={colorScheme === "dark" ? "#E5E7EB" : "#EF4444"}
              size={24}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#FFFFFF" : "#0000FF"}
        />
        <Text className="mt-4 text-gray-800 dark:text-gray-200">
          Loading templates...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 bg-gray-100 dark:bg-gray-900">
        <View className="p-4 bg-white dark:bg-gray-800 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 dark:text-white mt-2">
            Workout Templates
          </Text>
        </View>

        <FlatList
          className="flex-1 px-4 pt-4"
          ListHeaderComponent={
            <>
              <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                Predefined Workouts
              </Text>
            </>
          }
          data={predefinedTemplates}
          renderItem={({ item }) =>
            renderTemplateItem({ item, isUserTemplate: false })
          }
          keyExtractor={(item) => item.id.toString()}
          ListFooterComponent={
            <>
              <Text className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-white">
                Created Workouts
              </Text>
              {userTemplates.length === 0 && (
                <Text className="text-gray-500 dark:text-gray-400">
                  No created workouts yet
                </Text>
              )}
              {userTemplates.map((item) => (
                <React.Fragment key={item.id.toString()}>
                  {renderTemplateItem({ item, isUserTemplate: true })}
                </React.Fragment>
              ))}
            </>
          }
        />

        <View className="p-4">
          <Link href="/templateForm" asChild>
            <TouchableOpacity className="bg-blue-500 dark:bg-blue-600 p-4 rounded-lg">
              <Text className="text-white text-center font-semibold">
                Create New Template
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Modal
          transparent={true}
          animationType="fade"
          visible={isApplying}
          onRequestClose={() => {}}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <View className="bg-white dark:bg-gray-800 p-6 rounded-lg items-center">
              <ActivityIndicator
                size="large"
                color={colorScheme === "dark" ? "#FFFFFF" : "#0000FF"}
              />
              <Text className="mt-4 text-gray-800 dark:text-gray-200">
                Applying template...
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
