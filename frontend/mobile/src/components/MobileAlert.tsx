import { Ionicons } from '@expo/vector-icons';
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
    bg: theme.colors.successMuted,
    border: '#bde3d6',
    text: theme.colors.success,
    icon: 'checkmark',
  },
  error: {
    bg: theme.colors.dangerMuted,
    border: '#eab7ae',
    text: theme.colors.error,
    icon: 'alert',
  },
  warning: {
    bg: theme.colors.warningMuted,
    border: '#ecd9aa',
    text: theme.colors.warning,
    icon: 'warning',
  },
  info: {
    bg: theme.colors.accentMuted,
    border: '#b3ddd3',
    text: theme.colors.accent,
    icon: 'information-circle',
  },
} as const;

const styles = StyleSheet.create({
  alert: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.md,
    ...theme.shadow.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
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
      <View style={[styles.iconWrap, { backgroundColor: '#ffffff90' }]}>
        <Ionicons color={style.text} name={style.icon as any} size={16} />
      </View>
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
