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
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 52,
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.2,
  },
});

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    textColor: '#ffffff',
    shadow: theme.shadow.md,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSubtle,
    textColor: theme.colors.text,
    shadow: theme.shadow.sm,
  },
  ghost: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: 'transparent',
    textColor: theme.colors.accent,
    shadow: undefined,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
    textColor: '#ffffff',
    shadow: theme.shadow.sm,
  },
};

const sizeStyles = {
  sm: { 
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.sizes.sm,
  },
  md: { 
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    fontSize: theme.typography.sizes.base,
  },
  lg: { 
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.xxl,
    fontSize: theme.typography.sizes.lg,
  },
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

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: varStyle.backgroundColor,
          borderColor: varStyle.borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.5 },
        varStyle.shadow,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={varStyle.textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeStyle.fontSize,
              color: varStyle.textColor,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
