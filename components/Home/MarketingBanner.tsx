// smartbag-app/components/Home/MarketingBanner.tsx
import { MarketingBanner as BannerType } from "@/slices/marketingSlice";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View,
} from "react-native";
import BannerContainer from "./BannerContainer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MarketingBannerProps {
  banners: BannerType[];
  onActiveBannerChange: (banner: BannerType | null) => void;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function MarketingBanner({
  banners,
  onActiveBannerChange,
  onSelectCategory,
}: MarketingBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<BannerType>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset to first banner whenever the banner list changes
  useEffect(() => {
    setActiveIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
    if (banners.length > 0) onActiveBannerChange(banners[0]);
  }, [banners, onActiveBannerChange]);

  // Auto-rotate when there are multiple banners
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = banners[activeIndex]?.auto_rotate_interval ?? 4;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        onActiveBannerChange(banners[next]);
        return next;
      });
    }, interval * 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeIndex, banners, onActiveBannerChange]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveIndex(index);
      onActiveBannerChange(banners[index] ?? null);
    },
    [banners, onActiveBannerChange],
  );

  if (banners.length === 0) return null;

  return (
    <View>
      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id || item.id}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, position: "relative" }}>
            <Image
              source={{ uri: item.image_url }}
              style={{ width: SCREEN_WIDTH, height: 200 }}
              resizeMode="cover"
            />
            {item.containers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10, paddingTop: 6 }}
              >
                {item.containers.map((container, idx) => (
                  <BannerContainer
                    key={idx}
                    container={container}
                    onSelectCategory={onSelectCategory}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        )}
      />

      {/* Dot indicators */}
      {banners.length > 1 && (
        <View className="flex-row justify-center mt-2 gap-1">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
