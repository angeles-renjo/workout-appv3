import CreateTemplate from "@/components/CreateTemplate";
import TemplateSelectorPage from "@/components/TemplateSelector";
import { View } from "react-native";
export default function TabTwoScreen() {
  return (
    <View className="flex-1">
      <TemplateSelectorPage />
    </View>
  );
}
