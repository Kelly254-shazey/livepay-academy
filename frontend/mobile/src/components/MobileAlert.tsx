import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

interface MobileAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
}

const typeStyles = {
  success: {
    bg: theme.colors.success + '10',
    border: theme.colors.success,
    text: theme.colors.success,
    icon: 'OK',
  },
  error: {
    bg: theme.colors.error + '10',
    border: theme.colors.error,
    text: theme.colors.error,
    icon: '!',
  },
  warning: {
    bg: theme.colors.warning + '10',
    border: theme.colors.warning,
    text: theme.colors.warning,
    icon: '!',
  },
  info: {
    bg: theme.colors.accent + '10',
    border: theme.colors.accent,
    text: theme.colors.accent,
    icon: 'i',
  },
} as const;

const styles = StyleSheet.create({
  alert: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    minWidth: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export function MobileAlert({
  type,
  title,
  message,
  onDismiss,
}: MobileAlertProps) {
  const style = typeStyles[type];

  return (
    <View
      style={[
        styles.alert,
        {
          backgroundColor: style.bg,
          borderColor: style.border,
        },
      ]}
    >
      <Text style={[styles.icon, { color: style.text }]}>{style.icon}</Text>
      <View style={styles.content}>
        {title ? (
          <Text style={[styles.title, { color: style.text }]}>{title}</Text>
        ) : null}
        <Text style={[styles.message, { color: style.text }]}>{message}</Text>
      </View>
      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
        >
          <Text style={[styles.dismissText, { color: style.text }]}>x</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
