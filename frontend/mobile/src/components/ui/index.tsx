import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileButton } from '@/components/MobileButton';
import { useAppTheme, type Theme } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

interface HeadingProps {
  title: string;
  eyebrow?: string;
  body?: string;
  style?: StyleProp<TextStyle>;
}

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface LoadingStateProps {
  label?: string;
}

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: React.ReactNode;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const avatarSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
    textInputDisabled: {
      opacity: 0.72,
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
    dialogOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    dialogBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    dialogContent: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      maxHeight: '85%',
      width: '100%',
      maxWidth: 520,
      minHeight: 0,
      overflow: 'hidden',
      ...theme.shadow.lg,
    },
    dialogHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
    },
    dialogTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      fontFamily: theme.typography.displayFontFamily,
      flex: 1,
    },
    dialogCloseButton: {
      padding: theme.spacing.md,
      marginRight: -theme.spacing.md,
    },
    dialogCloseText: {
      fontSize: 28,
      color: theme.colors.textSecondary,
      fontWeight: '300',
    },
    dialogScroll: {
      flexGrow: 0,
      minHeight: 0,
    },
    dialogScrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.lg,
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
}

function getBadgeVariants(theme: Theme) {
  return {
    default: {
      container: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.borderSubtle },
      text: { color: theme.colors.text },
    },
    primary: {
      container: { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accentMuted },
      text: { color: theme.colors.accent },
    },
    success: {
      container: { backgroundColor: theme.colors.successMuted, borderColor: theme.colors.successMuted },
      text: { color: theme.colors.success },
    },
    warning: {
      container: { backgroundColor: theme.colors.warningMuted, borderColor: theme.colors.warningMuted },
      text: { color: theme.colors.warning },
    },
    danger: {
      container: { backgroundColor: theme.colors.dangerMuted, borderColor: theme.colors.dangerMuted },
      text: { color: theme.colors.danger },
    },
  };
}

export function Screen({ children, style }: ScreenProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
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

export function Surface({ children, style, padding }: SurfaceProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return <View style={[styles.surface, { padding: padding ?? theme.spacing.lg }, style]}>{children}</View>;
}

export function Heading({ title, eyebrow, body, style }: HeadingProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.headingContainer}>
      {eyebrow ? <Text style={[styles.eyebrow, style]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, style]}>{title}</Text>
      {body ? <Text style={[styles.body, style]}>{body}</Text> : null}
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  secureTextEntry = false,
  editable = true,
  style,
}: TextFieldProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.textFieldContainer, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          !editable && styles.textInputDisabled,
          error && styles.textInputError,
        ]}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secureTextEntry}
        value={value}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export { MobileButton as Button };

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const badgeVariants = getBadgeVariants(theme);
  const badgeStyle = badgeVariants[variant];

  return (
    <View style={[styles.badge, badgeStyle.container, style]}>
      <Text style={[styles.badgeText, badgeStyle.text]}>{children}</Text>
    </View>
  );
}

export function Dialog({ visible, onClose, title, children }: DialogProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.dialogOverlay}
      >
        <Pressable onPress={onClose} style={styles.dialogBackdrop} />
        <View style={styles.dialogContent}>
          {title ? (
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.dialogCloseButton}>
                <Text style={styles.dialogCloseText}>x</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={styles.dialogScrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.dialogScroll}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Avatar({ name, size = 'md', style }: AvatarProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const avatarSize = avatarSizes[size];
  const initials = name ? name.split(' ').map((item) => item[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <View style={[styles.avatar, avatarSize, style]}>
      <Text style={[styles.avatarText, { fontSize: avatarSize.width * 0.4 }]}>{initials}</Text>
    </View>
  );
}
