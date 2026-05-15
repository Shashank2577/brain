/**
 * Workspace sign-in screen (Phase 8 / ADR-006).
 *
 * Exchanges email + password for a mobile JWT via
 * `POST /_agent-native/auth/mobile-token`. On success the token + identity
 * metadata are persisted in AsyncStorage and the screen routes to the
 * registry-driven apps list at `/registry-apps`.
 *
 * Google OAuth is deferred to v2 — Google blocks the OAuth flow inside
 * embedded WebViews, so we'd need the system browser + a deep-link callback
 * to handle that path. Email/password is the simplest v1 sign-in.
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { signInWithPassword } from "@/lib/auth";
import { workspaceUrl } from "@/lib/config";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Email and password are both required.");
      return;
    }
    setSubmitting(true);
    const result = await signInWithPassword(trimmed, password);
    setSubmitting(false);

    if (!result.ok) {
      // Surface a friendly message for the two cases the user can act on,
      // and a generic one for everything else.
      if (result.reason === "invalid_credentials") {
        setError("Wrong email or password.");
      } else if (result.reason.startsWith("network_error")) {
        setError(
          `Couldn't reach the workspace at ${workspaceUrl()}. Make sure it's running.`,
        );
      } else {
        setError(`Sign-in failed (${result.reason}).`);
      }
      return;
    }

    router.replace("/registry-apps");
  }, [email, password, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Feather name="zap" size={36} color="#ffffff" />
          <Text style={styles.title}>Agent Native</Text>
          <Text style={styles.subtitle}>
            Sign in to your workspace
          </Text>
          <Text style={styles.workspaceHint} numberOfLines={1}>
            {workspaceUrl()}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#555555"
            editable={!submitting}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            placeholderTextColor="#555555"
            editable={!submitting}
          />

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#FCA5A5" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#111111" />
            ) : (
              <Text style={styles.submitText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footnote}>
            Google sign-in coming in v2. For now use email + password from
            your workspace.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 14,
  },
  subtitle: {
    color: "#999999",
    fontSize: 14,
    marginTop: 6,
  },
  workspaceHint: {
    color: "#555555",
    fontSize: 12,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  form: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    gap: 8,
  },
  label: {
    color: "#999999",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#1A1A1A",
    color: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#262626",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3F1313",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    flex: 1,
  },
  submit: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
  },
  footnote: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 17,
  },
});
