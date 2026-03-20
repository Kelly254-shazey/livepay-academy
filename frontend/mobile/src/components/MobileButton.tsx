import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

interface MobileButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.primary,
    pressedColor: theme.colors.primary + 'DD',
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    pressedColor: theme.colors.accent + '10',
  },
  ghost: {
    backgroundColor: 'transparent',
    pressedColor: theme.colors.accent + '10',
  },
  danger: {
    backgroundColor: theme.colors.error,
    pressedColor: theme.colors.error + 'DD',
  },
};

const sizeStyles = {
  sm: { paddingVertical: 8, paddingHorizontal: 12 },
  md: { paddingVertical: 12, paddingHorizontal: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 20 },
};

const textSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function MobileButton({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: MobileButtonProps) {
  const varStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textSize = textSizes[size];

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.surface
      : variant === 'secondary'
        ? theme.colors.accent
        : theme.colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        varStyle,
        sizeStyle,
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: textSize, color: textColor },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
