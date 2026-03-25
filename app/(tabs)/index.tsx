import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import CategoriesRow from "@/components/Home/CategoriesRow";
import CategorySection from "@/components/Home/CategorySection";
import SearchBar from "@/components/Home/SearchBar";
import TopBar from "@/components/Home/TopBar";
import SafeView from "@/components/SafeView";
import ShopStatusBanner from "@/components/ShopStatusBanner";
import { useProducts } from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

export default function App() {
  const [selectCategory, setSelectCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { categories, ProductsByCategory, loading, loadMore, pagination, refreshing, refresh } = useProducts(selectCategory, searchQuery);

  // Shop status polling is handled globally in _layout.tsx (every 2 min)

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectCategory(categoryId);
  }, []);

  const handleNavigateRequest = useCallback(() => {
    router.push("/requestProduct");
  }, []);

  const handleNavigatePorter = useCallback(() => {
    router.push("/porter");
  }, []);

  return (
    <SafeView className="flex-1 bg-white">
      <TopBar />
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <CategoriesRow
        categories={categories}
        selectedCategory={selectCategory}
        onSelectCategory={handleSelectCategory}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={["#FF6B35"]} // Optionally match the primary color
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
            <Text className="text-gray-700 font-semibold">{loading ? "Loading..." : "Load More"}</Text>
          </Pressable>
        )}

        {/* Extra Actions */}
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
      <ActiveOrderBanner />
    </SafeView>
  );
}