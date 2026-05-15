/**
 * Registry-driven apps list (Phase 8 / ADR-006).
 *
 * Replaces the static `DEFAULT_APPS` import with a network fetch against
 * `/_agent-native/registry/apps` — the same endpoint the web shell's left
 * rail consumes. Each entry shows name + icon + capability count, and
 * tapping it opens the app's UI in a WebView.
 *
 * If the registry call fails (network down, unauthorised), we surface a
 * retry button and a path back to the sign-in screen.
 */
import { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useRegistryApps, type RegistryApp } from "@/lib/use-registry-apps";
import { clearStoredToken, getStoredTokenMeta } from "@/lib/auth";
import { useEffect, useState } from "react";

const APP_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  mail: "mail",
  calendar: "calendar",
  content: "file-text",
  slides: "airplay",
  clips: "cast",
  analytics: "bar-chart-2",
  dispatch: "message-circle",
  forms: "clipboard",
  design: "edit-2",
  starter: "code",
  notes: "edit-3",
  tasks: "check-square",
  crm: "users",
  videos: "film",
};

function iconFor(app: RegistryApp): keyof typeof Feather.glyphMap {
  return APP_ICON[app.id] ?? "box";
}

export default function RegistryAppsScreen() {
  const router = useRouter();
  const { apps, loading, error, reload } = useRegistryApps();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void getStoredTokenMeta().then((meta) => {
      if (meta) setEmail(meta.email);
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    await clearStoredToken();
    router.replace("/sign-in");
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: RegistryApp }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: "/registry-apps/[id]",
            params: { id: item.id, url: item.url, name: item.name },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <Feather name={iconFor(item)} size={20} color="#ffffff" />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.rowDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.capCount}>
            {item.capabilities} {item.capabilities === 1 ? "cap" : "caps"}
          </Text>
          <Feather name="chevron-right" size={18} color="#555555" />
        </View>
      </TouchableOpacity>
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Apps",
          headerStyle: { backgroundColor: "#0B0B0B" },
          headerTintColor: "#ffffff",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.headerButton}
              accessibilityLabel="Sign out"
            >
              <Feather name="log-out" size={18} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      {loading && apps.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      ) : error && apps.length === 0 ? (
        <View style={styles.center}>
          <Feather name="alert-triangle" size={36} color="#EF4444" />
          <Text style={styles.errorTitle}>Couldn't load apps</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={reload}>
            <Feather name="refresh-cw" size={14} color="#111111" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign in again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={apps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            email ? (
              <View style={styles.userBar}>
                <Feather name="user" size={12} color="#888888" />
                <Text style={styles.userBarText}>{email}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                No apps registered in this workspace yet.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={reload}
              tintColor="#ffffff"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  userBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBarText: {
    color: "#888888",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1A1A1A",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
  },
  rowDescription: {
    color: "#666666",
    fontSize: 12,
    marginTop: 2,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  capCount: {
    color: "#555555",
    fontSize: 11,
  },
  headerButton: {
    padding: 8,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
  },
  errorText: {
    color: "#888888",
    fontSize: 13,
    textAlign: "center",
  },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  retryText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "600",
  },
  signOut: {
    marginTop: 16,
  },
  signOutText: {
    color: "#888888",
    fontSize: 13,
  },
  emptyText: {
    color: "#666666",
    fontSize: 13,
    textAlign: "center",
  },
});
