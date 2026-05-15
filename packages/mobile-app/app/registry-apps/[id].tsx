/**
 * WebView host for an individual mini-app (Phase 8 / ADR-006).
 *
 * Renders the template's existing web UI inside a `react-native-webview`.
 * The bearer JWT is injected via the `Authorization` header on the initial
 * request (`source.headers`) and propagated to in-page `fetch` calls via an
 * `injectedJavaScriptBeforeContentLoaded` shim that wraps `window.fetch`.
 *
 * v1 limitations:
 *   - The header is only on the initial document load and our injected
 *     `fetch` wrapper. WebSocket connections (used by some templates for
 *     live collaboration) do not inherit the header — those endpoints fall
 *     back to cookie auth.
 *   - We don't intercept anchor navigations; tapping an external link
 *     inside the WebView opens it in the same WebView. v2 routes external
 *     URLs to the system browser.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { getStoredToken } from "@/lib/auth";

/**
 * Inject a `fetch` wrapper into the WebView so XHR / `fetch` requests
 * carry the bearer JWT. Runs before the page's main script so any
 * template-side request goes through us.
 *
 * The injected script reads the token from a `window.__AGENT_NATIVE_TOKEN`
 * global we set via `injectedJavaScript`. It only adds the header when
 * the request targets the same origin as the document — third-party
 * fetches stay unmodified.
 */
const FETCH_PATCH_SCRIPT = `
(function() {
  if (window.__AGENT_NATIVE_FETCH_PATCHED__) return;
  window.__AGENT_NATIVE_FETCH_PATCHED__ = true;
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      var token = window.__AGENT_NATIVE_TOKEN;
      if (!token) return origFetch(input, init);
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var sameOrigin = false;
      try {
        var u = new URL(url, window.location.href);
        sameOrigin = u.origin === window.location.origin;
      } catch (e) {
        sameOrigin = url.startsWith('/');
      }
      if (!sameOrigin) return origFetch(input, init);
      var nextInit = Object.assign({}, init || {});
      var headers = new Headers((init && init.headers) || (typeof input !== 'string' ? input.headers : undefined));
      if (!headers.has('authorization')) {
        headers.set('authorization', 'Bearer ' + token);
      }
      nextInit.headers = headers;
      return origFetch(input, nextInit);
    } catch (e) {
      return origFetch(input, init);
    }
  };
  true;
})();
`;

export default function RegistryAppScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    url?: string;
    name?: string;
  }>();
  const webviewRef = useRef<WebView>(null);

  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getStoredToken().then((t) => {
      setToken(t);
      setTokenLoaded(true);
    });
  }, []);

  const handleReload = useCallback(() => {
    setError(null);
    setLoading(true);
    webviewRef.current?.reload();
  }, []);

  const url = typeof params.url === "string" ? params.url : "";
  const name = typeof params.name === "string" ? params.name : "App";

  if (!url) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No URL provided</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!tokenLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  // Build the `injectedJavaScript` that runs in the WebView main world. We
  // both set the token global and patch fetch so every same-origin XHR
  // automatically carries the bearer header.
  const injectedJs = `
    window.__AGENT_NATIVE_TOKEN = ${JSON.stringify(token ?? "")};
    ${FETCH_PATCH_SCRIPT}
  `;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: name,
          headerStyle: { backgroundColor: "#0B0B0B" },
          headerTintColor: "#ffffff",
          headerBackTitle: "Apps",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleReload}
              style={styles.headerButton}
              accessibilityLabel="Reload"
            >
              <Feather name="refresh-cw" size={18} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      {error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={36} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load {name}</Text>
          <Text style={styles.errorText}>{url}</Text>
          <TouchableOpacity onPress={handleReload} style={styles.retry}>
            <Feather name="refresh-cw" size={14} color="#111111" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{
            uri: url,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError("network");
          }}
          onHttpError={(syntheticEvent) => {
            const { statusCode } = syntheticEvent.nativeEvent;
            if (statusCode >= 500) {
              setError(`http ${statusCode}`);
            }
          }}
          injectedJavaScriptBeforeContentLoaded={injectedJs}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
        />
      )}

      {loading && !error && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(11,11,11,0.6)",
  },
  headerButton: {
    padding: 8,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#666666",
    fontSize: 12,
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
  back: {
    marginTop: 12,
  },
  backText: {
    color: "#888888",
    fontSize: 13,
  },
});
