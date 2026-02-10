import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Palette } from "../constants/theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "İstifadə qaydası" }}
        />
        <Stack.Screen
          name="history"
          options={{ title: "Alış-veriş Tarixçəsi", headerShown: false }}
        />
        <Stack.Screen
          name="insights"
          options={{ title: "Analitika", headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ title: "Bildirişlər", headerShown: false }}
        />
      </Stack>
      <StatusBar style="light" backgroundColor={Palette.primary} />
    </ThemeProvider>
  );
}
