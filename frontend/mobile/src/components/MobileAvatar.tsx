import { StyleSheet, View, Text, ViewProps } from 'react-native';
import { theme } from '../theme';

interface MobileAvatarProps extends ViewProps {
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away';
}

const sizeStyles = {
  sm: 32,
  md: 40,
  lg: 48,
};

const statusColors = {
  online: theme.colors.success,
  offline: theme.colors.textMuted,
  away: theme.colors.warning,
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.accent,
  },
  text: {
    fontWeight: '600',
    color: theme.colors.surface,
  },
  status: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
});

export function MobileAvatar({
  initials = 'U',
  size = 'md',
  status,
  style,
  ...props
}: MobileAvatarProps) {
  const dimension = sizeStyles[size];
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <View
      style={[
        styles.avatar,
        { width: dimension, height: dimension },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
      {status && (
        <View
          style={[
            styles.status,
            { backgroundColor: statusColors[status] },
          ]}
        />
      )}
    </View>
  );
}
