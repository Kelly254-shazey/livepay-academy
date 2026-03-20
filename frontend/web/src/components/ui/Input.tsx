import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  className,
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          disabled={disabled}
          className={`
            w-full px-4 py-2.5
            bg-surface border border-stroke rounded-lg
            text-text placeholder-muted
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
            focus:border-transparent
            disabled:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-75
            ${error ? 'border-danger focus:ring-danger' : ''}
            ${icon ? 'pl-10' : ''}
            ${className || ''}
          `}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
