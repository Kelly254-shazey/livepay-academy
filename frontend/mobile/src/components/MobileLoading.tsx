import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

interface MobileLoadingProps {
  size?: 'small' | 'large';
  message?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});

export function MobileLoading({
  size = 'large',
  message,
}: MobileLoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={theme.colors.accent}
      />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}
