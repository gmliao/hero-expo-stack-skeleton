import { Platform } from "react-native";
import { Alert } from "react-native";
import i18n from "@/lib/i18n";

/**
 * Global mutation onError handler for TanStack Query.
 * Surfaces any mutation failure as a native Alert dialog.
 * On web, uses window.alert directly so Playwright can detect it.
 */
export function handleMutationError(error: unknown): void {
  const title = i18n.t("common.errorTitle");
  const message =
    error instanceof Error ? error.message : i18n.t("common.unknownError");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
