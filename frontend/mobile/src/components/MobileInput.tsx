import { type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

interface MobileInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  secureTextEntry?: boolean;
  editable?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceMuted,
    fontFamily: theme.typography.fontFamily,
  },
  errorInput: {
    borderColor: theme.colors.danger,
  },
  hint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
});

export function MobileInput({
  placeholder,
  value,
  onChangeText,
  label,
  error,
  hint,
  icon,
  secureTextEntry,
  editable = true,
  multiline = false,
  maxLength,
}: MobileInputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          maxLength={maxLength}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            icon ? { paddingLeft: 44 } : null,
            error && styles.errorInput,
            multiline && { minHeight: 100, textAlignVertical: 'top' },
          ]}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
