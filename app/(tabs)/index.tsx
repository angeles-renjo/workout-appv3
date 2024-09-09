import CalendarComponent from "@/components/CalendarComponent";
import PushNotificationTest from "@/components/PushNotificationTest";
import React from "react";
import { Text, View, SafeAreaView } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <CalendarComponent />
    </SafeAreaView>
  );
}
