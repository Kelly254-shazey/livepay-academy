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
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.semibold,
  },
});

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    textColor: '#ffffff',
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    textColor: theme.colors.text,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: theme.colors.text,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
    textColor: '#ffffff',
  },
};

const sizeStyles = {
  sm: { 
    paddingVertical: theme.spacing.sm, 
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
  },
  md: { 
    paddingVertical: theme.spacing.md, 
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.sizes.base,
  },
  lg: { 
    paddingVertical: theme.spacing.lg, 
    paddingHorizontal: theme.spacing.xl,
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
        theme.shadow.sm,
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
