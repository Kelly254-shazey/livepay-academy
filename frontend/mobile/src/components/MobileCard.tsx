import { type ReactNode } from 'react';
import {
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

interface MobileCardProps {
  children: ReactNode;
  onPress?: () => void;
  interactive?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.sm,
  },
});

export function MobileCard({
  children,
  onPress,
  interactive = false,
  padding = theme.spacing.lg,
  style,
  testID,
}: MobileCardProps) {
  if (onPress || interactive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, { padding }, style]}
        testID={testID}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.card, { padding }, style]}
      testID={testID}
    >
      {children}
    </View>
  );
}
