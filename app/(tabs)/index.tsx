import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import CategoriesRow from "@/components/Home/CategoriesRow";
import CategorySection from "@/components/Home/CategorySection";
import MarketingBanner from "@/components/Home/MarketingBanner";
import SearchBar from "@/components/Home/SearchBar";
import TopBar from "@/components/Home/TopBar";
import SafeView from "@/components/SafeView";
import ShopStatusBanner from "@/components/ShopStatusBanner";
import { useProducts } from "@/hooks/useProducts";
import { MarketingBanner as BannerType } from "@/slices/marketingSlice";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSelector } from "react-redux";

const DEFAULT_BG = "#FFFFFF";

export default function App() {
  const [selectCategory, setSelectCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { categories, ProductsByCategory, loading, loadMore, pagination, refreshing, refresh } =
    useProducts(selectCategory, searchQuery);

  const { banners } = useSelector((state: RootState) => state.marketing);
  const [headerBg, setHeaderBg] = useState<string>(DEFAULT_BG);
  const bgAnim = useRef(new Animated.Value(0)).current;
  const prevColorRef = useRef(DEFAULT_BG);
  const currentColorRef = useRef(DEFAULT_BG);

  const handleActiveBannerChange = useCallback((banner: BannerType | null) => {
    const newColor = banner?.bg_color ?? DEFAULT_BG;
    prevColorRef.current = currentColorRef.current;
    currentColorRef.current = newColor;
    bgAnim.setValue(0);
    Animated.timing(bgAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    setHeaderBg(newColor);
  }, [bgAnim]);

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectCategory(categoryId);
  }, []);

  const handleNavigateRequest = useCallback(() => router.push("/requestProduct"), []);
  const handleNavigatePorter = useCallback(() => router.push("/porter"), []);

  const headerBgColor = banners.length > 0 ? headerBg : DEFAULT_BG;

  return (
    <SafeView className="flex-1" style={{ backgroundColor: headerBgColor }}>
      <View style={{ backgroundColor: headerBgColor }}>
        <TopBar />
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <CategoriesRow
          categories={categories}
          selectedCategory={selectCategory}
          onSelectCategory={handleSelectCategory}
        />
        {banners.length > 0 && (
          <MarketingBanner
            banners={banners}
            onActiveBannerChange={handleActiveBannerChange}
            onSelectCategory={handleSelectCategory}
          />
        )}
      </View>

      <View style={{ flex: 1, backgroundColor: "#FCF8F8" }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={["#FF6B35"]}
            />
          }
        >
          <ShopStatusBanner />

          {ProductsByCategory.map((category) =>
            category.products.length > 0 ? (
              <CategorySection
                key={category.id}
                title={category.name}
                products={category.products}
                onEndReached={loadMore}
                loading={loading}
              />
            ) : null
          )}

          {pagination?.hasNextPage && (
            <Pressable
              onPress={loadMore}
              className="fmx-4 my-6 py-3 bg-gray-100 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold">
                {loading ? "Loading..." : "Load More"}
              </Text>
            </Pressable>
          )}

          <View className="flex-row px-4 gap-4 mt-4 mb-12">
            <Pressable
              onPress={handleNavigateRequest}
              className="flex-1 bg-[#FF6B35] rounded-2xl py-4 items-center justify-center"
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text className="text-white font-semibold text-sm mt-1">Request Product</Text>
            </Pressable>

            <Pressable
              onPress={handleNavigatePorter}
              className="flex-1 bg-[#34C759] rounded-2xl py-4 items-center justify-center"
            >
              <Ionicons name="bicycle-outline" size={24} color="white" />
              <Text className="text-white font-semibold text-sm mt-1">Porter Service</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <ActiveOrderBanner />
    </SafeView>
  );
}
