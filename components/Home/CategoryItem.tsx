import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type CategoryItemProps = {
  label: string;
  image?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  bg: string;
  onPress: () => void;
};

function CategoryItem({
  label,
  image,
  icon,
  bg,
  onPress,
}: CategoryItemProps) {
  return (
    <Pressable className="items-center w-16" onPress={onPress}>
      <View
        className={`w-14 h-14 rounded-full ${bg} items-center justify-center shadow-sm`}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-8 h-8"
            resizeMode="contain"
          />
        ) : icon ? (
          <Ionicons name={icon} size={22} color="#111" />
        ) : null}
      </View>

      <Text className="text-xs font-medium text-center mt-2 leading-4 text-gray-800">
        {label}
      </Text>
    </Pressable>
  );
}

export default React.memo(CategoryItem);