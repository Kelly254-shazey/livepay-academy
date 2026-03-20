import { type ChangeEvent, type ReactNode, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      options,
      placeholder,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted flex-shrink-0 pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 ${icon ? 'pl-10' : ''} rounded-lg
              border-2 border-stroke bg-surface text-text
              appearance-none cursor-pointer
              focus:outline-none focus:border-accent
              transition-colors duration-200
              disabled:bg-surface-muted disabled:cursor-not-allowed
              ${error ? 'border-error focus:border-error' : ''}
              ${className || ''}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
        {(hint || error) && (
          <p
            className={`text-xs mt-1.5 ${error ? 'text-error' : 'text-muted'}`}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
