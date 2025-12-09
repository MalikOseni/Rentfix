import { ColorSchemeName, useColorScheme } from 'react-native';
import { darkPalette, lightPalette, Palette } from './colors';
import { typography } from './typography';

export type Theme = {
  colors: Palette;
  typography: typeof typography;
  spacing: (multiplier?: number) => number;
};

const spacing = (multiplier = 1) => 8 * multiplier;

export const createTheme = (scheme: ColorSchemeName = 'light'): Theme => ({
  colors: scheme === 'dark' ? darkPalette : lightPalette,
  typography,
  spacing
});

export const useTheme = () => {
  const scheme = useColorScheme();
  return createTheme(scheme);
};
