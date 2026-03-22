interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-hover focus:ring-accent/20',
  secondary: 'bg-surface text-text border-border hover:bg-surface-muted focus:ring-accent/20',
  ghost: 'bg-transparent text-text border-transparent hover:bg-hover focus:ring-accent/20',
  danger: 'bg-danger text-white border-danger hover:bg-red-600 focus:ring-danger/20',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm font-medium rounded-lg',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg',
  lg: 'px-6 py-2.5 text-base font-semibold rounded-lg',
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
        inline-flex items-center justify-center gap-2
        border transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className || ''}
      `}
      {...props}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
