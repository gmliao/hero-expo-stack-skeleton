import { Platform } from "react-native";
import { Alert } from "react-native";

/**
 * Global mutation onError handler for TanStack Query.
 * Surfaces any mutation failure as a native Alert dialog.
 * On web, uses window.alert directly so Playwright can detect it.
 */
export function handleMutationError(error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`Error\n\n${message}`);
  } else {
    Alert.alert("Error", message);
  }
}
