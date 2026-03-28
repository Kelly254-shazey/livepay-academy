import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme, type Theme } from '../theme';

interface MobileButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
}

function getVariantStyles(theme: Theme) {
  return {
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
}

function getSizeStyles(theme: Theme) {
  return {
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
}

export function MobileButton({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: MobileButtonProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const variantStyles = getVariantStyles(theme)[variant];
  const sizeStyles = getSizeStyles(theme)[size];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.5 },
        variantStyles.shadow,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
