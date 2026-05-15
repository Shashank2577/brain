import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getStoredToken } from "@/lib/auth";

/**
 * Root layout for the Phase 8 mobile shell.
 *
 * Auth gate: on cold boot we read the workspace JWT from AsyncStorage. If
 * absent, the user is redirected to `/sign-in`; otherwise the rest of the
 * navigation tree mounts. The legacy `(tabs)` group is kept so the existing
 * `TEMPLATE_APPS`-driven flow still works for users who haven't migrated
 * — they land there by default if a session token is already present.
 *
 * The Phase 8 registry-driven screens live at `/registry-apps` and
 * `/registry-apps/[id]`, addressable from sign-in.
 */
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getStoredToken();
      if (cancelled) return;
      setReady(true);
      const onAuthScreen = segments[0] === "sign-in";
      if (!token && !onAuthScreen) {
        router.replace("/sign-in");
      } else if (token && onAuthScreen) {
        router.replace("/registry-apps");
      }
    })();
    return () => {
      cancelled = true;
    };
    // We only want to run this on initial mount + when the segments change
    // (e.g., after sign-in pushes to /registry-apps).
  }, [router, segments]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0B0B0B" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0B0B0B" },
        }}
      >
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="registry-apps" options={{ headerShown: true }} />
        <Stack.Screen
          name="registry-apps/[id]"
          options={{ headerShown: true, headerBackTitle: "Apps" }}
        />
        {/* Legacy screens kept for the existing static-config flow. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="app/[id]"
          options={{
            headerShown: true,
            headerBackTitle: "Apps",
          }}
        />
        <Stack.Screen name="oauth-complete" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0B0B",
  },
});
