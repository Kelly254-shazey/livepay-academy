import { palette } from '@livegate/shared';
import { Platform } from 'react-native';

function createShadow({
  color,
  x,
  y,
  blur,
  opacity,
  elevation,
}: {
  color: string;
  x: number;
  y: number;
  blur: number;
  opacity: number;
  elevation: number;
}) {
  if (Platform.OS === 'web') {
    const rgba =
      color === '#171512'
        ? `rgba(23,21,18,${opacity})`
        : `rgba(16,33,29,${opacity})`;

    return {
      boxShadow: `${x}px ${y}px ${blur}px ${rgba}`,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: x, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}

export const theme = {
  colors: {
    background: palette.canvas,
    surface: palette.surface,
    mutedSurface: palette.surfaceMuted,
    elevatedSurface: '#FCFFFD',
    border: palette.stroke,
    stroke: palette.stroke,
    text: palette.text,
    mutedText: palette.textMuted,
    muted: palette.textMuted,
    accent: palette.accent,
    primary: palette.accent,
    accentMuted: palette.accentMuted,
    success: palette.success,
    successLight: '#4ade80',
    warning: palette.warning,
    warningLight: '#fbbf24',
    danger: palette.danger,
    dangerLight: '#f87171',
    error: palette.danger,
    info: '#0ea5e9',
    infoLight: '#38bdf8',
    roleCreator: '#a78bfa',      /* Purple */
    roleViewer: '#60a5fa',       /* Blue */
    roleAdmin: '#f87171',        /* Red */
    roleModerator: '#fbbf24',    /* Amber */
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
    soft: createShadow({ color: '#171512', x: 0, y: 14, blur: 28, opacity: 0.08, elevation: 6 }),
    panel: createShadow({ color: '#171512', x: 0, y: 16, blur: 32, opacity: 0.1, elevation: 8 }),
    lift: createShadow({ color: '#171512', x: 0, y: 12, blur: 24, opacity: 0.08, elevation: 6 }),
  },
};
