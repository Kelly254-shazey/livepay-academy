import { type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '@/theme';

export function Screen({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.backgroundOrbPrimary} />
      <View style={styles.backgroundOrbSecondary} />
      {children}
    </ScrollView>
  ) : (
    <View style={styles.scrollContent}>
      <View style={styles.backgroundOrbPrimary} />
      <View style={styles.backgroundOrbSecondary} />
      {children}
    </View>
  );

  return <SafeAreaView style={styles.screen}>{content}</SafeAreaView>;
}

export function Surface({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function Heading({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

export function Button({
  title,
  variant = 'primary',
  onPress,
  disabled,
}: {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress?: () => void;
  disabled?: boolean;
}) {
  const variants = {
    primary: { backgroundColor: theme.colors.text, borderColor: theme.colors.text, color: theme.colors.background },
    secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent', color: theme.colors.mutedText },
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.55 : pressed ? 0.9 : 1, transform: [{ translateY: pressed ? 1 : 0 }] },
        {
          backgroundColor: variants[variant].backgroundColor,
          borderColor: variants[variant].borderColor,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: variants[variant].color }]}>{title}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
}: {
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Surface>
      <View style={styles.emptyBadge} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </Surface>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <Surface style={{ alignItems: 'center', gap: 12, paddingVertical: 32 }}>
      <ActivityIndicator color={theme.colors.accent} />
      <Text style={styles.body}>{label}</Text>
    </Surface>
  );
}

export function MetaRow({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaText}>{left}</Text>
      <Text style={styles.metaText}>{right}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  surface: {
    backgroundColor: theme.colors.elevatedSurface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: theme.colors.mutedText,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.mutedText,
  },
  button: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.mutedText,
  },
  backgroundOrbPrimary: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  backgroundOrbSecondary: {
    position: 'absolute',
    top: 120,
    left: -34,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(154, 106, 42, 0.08)',
  },
  emptyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accentMuted,
  },
});
