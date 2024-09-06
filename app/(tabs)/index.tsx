import CalendarComponent from "@/components/CalendarComponent";
import React from "react";
import { Text, View, SafeAreaView } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 ">
      <CalendarComponent />
    </SafeAreaView>
  );
}
