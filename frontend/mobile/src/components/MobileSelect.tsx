import { useState } from 'react';
import {
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

interface MobileSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  label?: string;
  placeholder?: string;
  options: MobileSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  select: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  caret: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
  optionsContainer: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.sm,
    maxHeight: 300,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedOption: {
    backgroundColor: theme.colors.accent + '10',
  },
  selectedText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  disabledOption: {
    opacity: 0.5,
  },
});

export function MobileSelect({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
  error,
  hint,
  disabled = false,
  style,
  testID,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen((current) => !current);
    }
  };

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setIsOpen(false);
  };

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        onPress={toggleOpen}
        activeOpacity={0.8}
        disabled={disabled}
        style={[
          styles.select,
          error && { borderColor: theme.colors.danger },
          disabled && styles.disabledOption,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && styles.placeholder,
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.caret}>{isOpen ? '^' : 'v'}</Text>
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const isDisabled = disabled || option.disabled;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => !isDisabled && handleSelect(option.value)}
                disabled={isDisabled}
                style={[
                  styles.option,
                  value === option.value && styles.selectedOption,
                  isDisabled && styles.disabledOption,
                  index === options.length - 1 && { borderBottomWidth: 0 },
                ]}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isDisabled,
                  selected: value === option.value,
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === option.value && styles.selectedText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
