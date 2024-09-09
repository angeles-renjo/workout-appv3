import PushNotificationTest from "@/components/PushNotificationTest";
import TemplateCreator from "@/components/TemplateCreator";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const Test = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <TemplateCreator />
      {/* <PushNotificationTest /> */}
    </SafeAreaView>
  );
};

export default Test;
