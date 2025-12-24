/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Palette = {
  primary: '#006738',
  secondary: '#FDD000',
  background: '#F7F7F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E5E5',
  textPrimary: '#000000',
  textSecondary: '#666666',
  accent: '#006738',
  success: '#006738',
  info: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
  lightGreen: '#E6F4EA',
  lightYellow: '#FFF9E6',
};

export const Shadows = {
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};

const tintColorLight = Palette.primary;
const tintColorDark = Palette.primary;

export const Colors = {
  light: {
    text: Palette.textPrimary,
    background: Palette.background,
    tint: tintColorLight,
    icon: Palette.textSecondary,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Palette.textPrimary,
    background: Palette.background,
    tint: tintColorDark,
    icon: Palette.textSecondary,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const spacing = (value: number) => value * 8;
