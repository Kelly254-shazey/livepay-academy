import { palette } from '@livegate/shared';

export const theme = {
  colors: {
    background: palette.canvas,
    surface: palette.surface,
    mutedSurface: palette.surfaceMuted,
    elevatedSurface: '#FFFEFB',
    border: palette.stroke,
    text: palette.text,
    mutedText: palette.textMuted,
    accent: palette.accent,
    accentMuted: palette.accentMuted,
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  radius: {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 30,
    pill: 999,
  },
  shadow: {
    soft: {
      shadowColor: '#171512',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.08,
      shadowRadius: 28,
      elevation: 6,
    },
  },
};
