import { type ChangeEvent, type ReactNode, forwardRef } from 'react';

interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'children'
  > {
  label?: string;
  error?: string;
  description?: string;
  icon?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, icon, className, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="relative mt-1 flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-5 h-5 rounded border-2 border-stroke bg-surface
              text-accent focus:ring-2 focus:ring-accent/30
              focus:outline-none cursor-pointer
              accent-accent
              disabled:bg-surface-muted disabled:cursor-not-allowed
              ${error ? 'border-error' : ''}
              ${className || ''}
            `}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label className="block text-sm font-medium text-text cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted mt-0.5">{description}</p>
            )}
            {error && <p className="text-xs text-error mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
