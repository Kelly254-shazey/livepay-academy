import {
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

interface MobileBadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  onPress?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const variantColors = {
  primary: {
    bg: theme.colors.accent + '10',
    border: theme.colors.accent,
    text: theme.colors.accent,
  },
  success: {
    bg: theme.colors.success + '10',
    border: theme.colors.success,
    text: theme.colors.success,
  },
  warning: {
    bg: theme.colors.warning + '10',
    border: theme.colors.warning,
    text: theme.colors.warning,
  },
  error: {
    bg: theme.colors.error + '10',
    border: theme.colors.error,
    text: theme.colors.error,
  },
  info: {
    bg: theme.colors.accent + '10',
    border: theme.colors.accent,
    text: theme.colors.accent,
  },
} as const;

const sizeStyles = {
  sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  md: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 13,
  },
} as const;

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
  dismissButton: {
    paddingLeft: theme.spacing.xs,
  },
});

export function MobileBadge({
  label,
  variant = 'primary',
  size = 'md',
  onPress,
  dismissible = false,
  onDismiss,
  style,
  testID,
}: MobileBadgeProps) {
  const colors = variantColors[variant];
  const sizeStyle = sizeStyles[size];
  const containerStyle: StyleProp<ViewStyle> = [
    styles.badge,
    {
      backgroundColor: colors.bg,
      borderColor: colors.border,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
    },
    style,
  ];

  const content = (
    <>
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: sizeStyle.fontSize },
        ]}
      >
        {label}
      </Text>
      {dismissible ? (
        <TouchableOpacity
          onPress={onDismiss}
          disabled={!onDismiss}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${label}`}
          style={styles.dismissButton}
        >
          <Text style={{ color: colors.text, fontSize: 16 }}>x</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={containerStyle}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={containerStyle}
      testID={testID}
    >
      {content}
    </View>
  );
}
