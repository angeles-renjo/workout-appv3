import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AppProvider } from "@/context/AppContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AppProvider>
        <TabLayoutContent colorScheme={colorScheme || "light"} />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function TabLayoutContent({ colorScheme }: { colorScheme: "light" | "dark" }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? "home" : "home"} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="template"
          options={{
            title: "Template",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="file-text" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="test"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="settings" color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
