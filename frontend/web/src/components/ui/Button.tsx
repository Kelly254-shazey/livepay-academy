import { type PropsWithChildren } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-accent text-surface hover:bg-accent/90 active:bg-accent/80 disabled:bg-surface-muted disabled:text-muted',
  secondary: 'bg-surface-muted text-text hover:bg-stroke active:bg-stroke/80 disabled:bg-surface-muted disabled:text-muted',
  ghost: 'text-text hover:bg-surface-muted active:bg-stroke disabled:text-muted',
  danger: 'bg-danger text-surface hover:bg-danger/90 active:bg-danger/80 disabled:bg-surface-muted',
  success: 'bg-success text-surface hover:bg-success/90 active:bg-success/80 disabled:bg-surface-muted',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm font-medium rounded-lg gap-2',
  md: 'px-4 py-2.5 text-base font-medium rounded-lg gap-2',
  lg: 'px-6 py-3 text-lg font-semibold rounded-xl gap-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  fullWidth,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200 ease-out
        font-medium tracking-tight
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className || ''}
      `}
      {...props}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}
