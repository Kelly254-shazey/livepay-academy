import {
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

interface MobileCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  error: {
    fontSize: 12,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
});

export function MobileCheckbox({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  error,
  style,
  testID,
}: MobileCheckboxProps) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, disabled && { opacity: 0.5 }, style]}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
    >
      <View
        style={[
          styles.checkbox,
          value && styles.checkedBox,
        ]}
      >
        {value ? (
          <Text style={{ color: theme.colors.surface, fontSize: 14 }}>x</Text>
        ) : null}
      </View>
      <View style={styles.content}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
