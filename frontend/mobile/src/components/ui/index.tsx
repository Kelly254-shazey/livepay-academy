import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { MobileButton } from '@/components/MobileButton';

// Screen Container
interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, style }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screenShell}>
      <View style={styles.screenGlowPrimary} />
      <View style={styles.screenGlowSecondary} />
      <ScrollView
        style={[styles.screen, style]}
        contentContainerStyle={[
          styles.screenContent,
          { paddingBottom: Math.max(insets.bottom + theme.spacing.xxxl, 112) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// Surface (Card-like container)
interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Surface({ children, style, padding = theme.spacing.lg }: SurfaceProps) {
  return (
    <View style={[styles.surface, { padding }, style]}>
      {children}
    </View>
  );
}

// Typography Components
interface HeadingProps {
  title: string;
  eyebrow?: string;
  body?: string;
  style?: StyleProp<TextStyle>;
}

export function Heading({ title, eyebrow, body, style }: HeadingProps) {
  return (
    <View style={styles.headingContainer}>
      {eyebrow && (
        <Text style={[styles.eyebrow, style]}>{eyebrow}</Text>
      )}
      <Text style={[styles.title, style]}>{title}</Text>
      {body && (
        <Text style={[styles.body, style]}>{body}</Text>
      )}
    </View>
  );
}

// Text Field
interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  secureTextEntry = false,
  style,
}: TextFieldProps) {
  return (
    <View style={[styles.textFieldContainer, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error && styles.textInputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        secureTextEntry={secureTextEntry}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Button (using the updated MobileButton)
export { MobileButton as Button };

// Loading State
interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

// Empty State
interface EmptyStateProps {
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={styles.emptyBody}>{body}</Text>}
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

// Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const badgeStyle = badgeVariants[variant];
  
  return (
    <View style={[styles.badge, badgeStyle.container, style]}>
      <Text style={[styles.badgeText, badgeStyle.text]}>{children}</Text>
    </View>
  );
}

// Avatar
interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ name, size = 'md', style }: AvatarProps) {
  const avatarSize = avatarSizes[size];
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  
  return (
    <View style={[styles.avatar, avatarSize, style]}>
      <Text style={[styles.avatarText, { fontSize: avatarSize.width * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenShell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenGlowPrimary: {
    position: 'absolute',
    top: -80,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.backgroundAccent,
    opacity: 0.9,
  },
  screenGlowSecondary: {
    position: 'absolute',
    top: 120,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    opacity: 0.45,
  },
  screenContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  surface: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.md,
    ...theme.shadow.md,
  },
  headingContainer: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: theme.typography.sizes['4xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    lineHeight: theme.typography.sizes['4xl'] * 1.12,
    fontFamily: theme.typography.displayFontFamily,
  },
  body: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.sizes.base * 1.5,
  },
  textFieldContainer: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceMuted,
    fontFamily: theme.typography.fontFamily,
  },
  textInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    fontFamily: theme.typography.displayFontFamily,
  },
  emptyBody: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.sizes.base * 1.5,
  },
  emptyAction: {
    marginTop: theme.spacing.md,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.4,
  },
  avatar: {
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent,
    fontFamily: theme.typography.displayFontFamily,
  },
});

const badgeVariants = {
  default: {
    container: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.borderSubtle },
    text: { color: theme.colors.text },
  },
  primary: {
    container: { backgroundColor: theme.colors.accentMuted, borderColor: '#b3ddd3' },
    text: { color: theme.colors.accent },
  },
  success: {
    container: { backgroundColor: theme.colors.successMuted, borderColor: '#bde3d6' },
    text: { color: theme.colors.success },
  },
  warning: {
    container: { backgroundColor: theme.colors.warningMuted, borderColor: '#ecd9aa' },
    text: { color: theme.colors.warning },
  },
  danger: {
    container: { backgroundColor: theme.colors.dangerMuted, borderColor: '#eab7ae' },
    text: { color: theme.colors.danger },
  },
};

const avatarSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
};
