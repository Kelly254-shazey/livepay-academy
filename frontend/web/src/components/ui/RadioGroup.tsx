import { forwardRef, type InputHTMLAttributes, useId } from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'children' | 'onChange' | 'type' | 'value'
  > {
  label?: string;
  error?: string;
  hint?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    {
      label,
      error,
      hint,
      options,
      value,
      onChange,
      className,
      name,
      disabled,
      ...props
    },
    ref
  ) => {
    const groupId = useId();
    const helperId = error
      ? `${groupId}-error`
      : hint
        ? `${groupId}-hint`
        : undefined;

    return (
      <fieldset
        className="w-full"
        aria-describedby={helperId}
      >
        {label ? (
          <legend className="block text-sm font-medium text-text mb-3">
            {label}
          </legend>
        ) : null}
        <div className="space-y-3">
          {options.map((option, index) => {
            const optionId = `${groupId}-${option.value}`;
            const optionDisabled = disabled || option.disabled;
            const optionRef =
              value === option.value || (!value && index === 0) ? ref : undefined;

            return (
              <label
                htmlFor={optionId}
                key={option.value}
                className="flex items-start gap-3 p-3 rounded-lg border-2 border-stroke hover:border-accent/30 transition-colors cursor-pointer"
              >
                <input
                  id={optionId}
                  ref={optionRef}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(event) => onChange?.(event.target.value)}
                  disabled={optionDisabled}
                  className={`
                    mt-1 w-4 h-4 border-2 border-stroke bg-surface
                    text-accent focus:ring-2 focus:ring-accent/30
                    focus:outline-none cursor-pointer
                    accent-accent flex-shrink-0
                    disabled:bg-surface-muted disabled:cursor-not-allowed
                    ${error ? 'border-error' : ''}
                    ${className || ''}
                  `}
                  {...props}
                />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text">
                    {option.label}
                  </span>
                  {option.description ? (
                    <p className="text-xs text-muted mt-1">
                      {option.description}
                    </p>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
        {hint || error ? (
          <p
            id={helperId}
            className={`text-xs mt-2 ${error ? 'text-error' : 'text-muted'}`}
          >
            {error || hint}
          </p>
        ) : null}
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
