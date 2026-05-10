// smartbag-app/components/Home/BannerContainer.tsx
import { MarketingContainer } from "@/slices/marketingSlice";
import { router } from "expo-router";
import { Image, Linking, Pressable, Text, View } from "react-native";

interface BannerContainerProps {
  container: MarketingContainer;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function BannerContainer({ container, onSelectCategory }: BannerContainerProps) {
  const handlePress = () => {
    switch (container.link_type) {
      case "category":
        onSelectCategory(container.link_value || null);
        break;
      case "product":
        router.push(`/product/${container.link_value}` as any);
        break;
      case "url":
        if (container.link_value) Linking.openURL(container.link_value);
        break;
      default:
        break;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ backgroundColor: container.bg_color }}
      className="w-32 rounded-xl mr-3 p-2 items-center justify-between"
    >
      <Text className="text-xs font-bold text-center mb-2 text-gray-800" numberOfLines={2}>
        {container.title}
      </Text>
      {container.image_url ? (
        <Image
          source={{ uri: container.image_url }}
          className="w-24 h-20 rounded-lg"
          resizeMode="contain"
        />
      ) : (
        <View className="w-24 h-20 rounded-lg bg-gray-200" />
      )}
    </Pressable>
  );
}
