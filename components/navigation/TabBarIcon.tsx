import React from "react";
import { Feather } from "@expo/vector-icons";
import { IconProps } from "@expo/vector-icons/build/createIconSet";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export function TabBarIcon({
  name,
  color,
  size = 24,
  style,
}: IconProps<FeatherIconName>) {
  return (
    <Feather
      name={name}
      size={size}
      color={color}
      style={[{ marginBottom: -3 }, style]}
    />
  );
}
