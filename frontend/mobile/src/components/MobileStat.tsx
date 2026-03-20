import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

interface MobileStatProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  stat: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export function MobileStat({
  label,
  value,
  change,
  style,
  testID,
}: MobileStatProps) {
  const changeColor =
    change?.trend === 'up' ? theme.colors.success : theme.colors.danger;

  return (
    <View
      style={[styles.stat, style]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {change ? (
        <View style={styles.change}>
          <Text
            style={[
              styles.changeText,
              { color: changeColor },
            ]}
          >
            {change.trend === 'up' ? '+' : '-'}
            {Math.abs(change.value)}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}
