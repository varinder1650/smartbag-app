import "../global.css";

import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingLogo from "@/components/LoadingLogo";
import { NotificationProvider } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchAddresses } from "@/slices/addressSlice";
import { restoreAuth } from "@/slices/authSlice";
import { fetchPrices } from "@/slices/priceSlice";
import { fetchShopStatus } from "@/slices/shopStatusSlice";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { mergeGuestCart, syncUserCart } from "../slices/cart.thunks";
import { AppDispatch, persistor, RootState, store } from "../store/store";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingLogo />} persistor={persistor}>
          <NotificationProvider>
            <RootLayoutWithProviders />
          </NotificationProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

function RootLayoutWithProviders() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, requirePhone } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const segments = useSegments();

  // Restore session on mount
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const result = await dispatch(restoreAuth());

        if (restoreAuth.fulfilled.match(result) && mounted) {
          const guestItems = Object.values(store.getState().cart.guest.items);
          if (guestItems.length > 0) {
            await dispatch(mergeGuestCart(guestItems));
          }
        }
      } catch (error) {
        if (__DEV__) console.error("Error restoring session:", error);
      } finally {
        if (mounted) {
          setInitialLoadComplete(true);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Sync cart and addresses when authenticated and profile is complete
  useEffect(() => {
    if (isAuthenticated && !requirePhone) {
      dispatch(syncUserCart());
      dispatch(fetchAddresses());
    }
  }, [isAuthenticated, requirePhone, dispatch]);

  // Fetch prices
  useEffect(() => {
    dispatch(fetchPrices());
    dispatch(fetchShopStatus());

    const interval = setInterval(() => {
      dispatch(fetchShopStatus());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [dispatch]);

  const inAuthGroup = segments[0] === "(auth)";

  // Determine what to render
  const shouldShowLoading = !initialLoadComplete || isLoading;

  let redirectPath: string | null = null;
  if (!shouldShowLoading) {
    if (!isAuthenticated && !inAuthGroup) {
      redirectPath = "/(auth)/login";
    } else if (isAuthenticated && inAuthGroup && !requirePhone) {
      if (__DEV__) console.log('Redirecting to /(tabs), segments:', segments);
      redirectPath = "/(tabs)";
    } else if (isAuthenticated && requirePhone && segments[1] !== "require_phone") {
      redirectPath = "/(auth)/require_phone";
    }
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {shouldShowLoading ? (
        <LoadingLogo />
      ) : redirectPath ? (
        <Redirect href={redirectPath as any} />
      ) : (
        <>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(orders)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product/[id]"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="cart"
              options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }}
            />
            <Stack.Screen
              name="notifications"
              options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }}
            />
            <Stack.Screen
              name="address"
              options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }}
            />
            <Stack.Screen
              name="requestProduct"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="porter"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="editProfile"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="terms"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="checkout"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="help"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="chat"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="order-tracking"
              options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="map-picker"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </>
      )}
    </ThemeProvider>
  );
}