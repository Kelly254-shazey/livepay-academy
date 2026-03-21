interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary:
    'border border-accent/60 bg-accent text-surface shadow-glass hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-glass-lg active:translate-y-0 active:bg-accent/80 disabled:border-white/25 disabled:bg-surface-muted disabled:text-muted',
  secondary:
    'border border-white/40 bg-white/25 text-text backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/35 active:translate-y-0 active:bg-white/30 disabled:border-white/20 disabled:bg-surface-muted disabled:text-muted',
  ghost:
    'border border-transparent bg-transparent text-text hover:bg-white/20 hover:text-text active:bg-white/25 disabled:text-muted',
  danger:
    'border border-danger/60 bg-danger text-surface shadow-[0_14px_36px_rgba(164,75,64,0.2)] hover:-translate-y-0.5 hover:bg-danger/90 active:translate-y-0 active:bg-danger/80 disabled:border-white/25 disabled:bg-surface-muted',
  success:
    'border border-success/60 bg-success text-surface shadow-[0_14px_36px_rgba(25,107,89,0.18)] hover:-translate-y-0.5 hover:bg-success/90 active:translate-y-0 active:bg-success/80 disabled:border-white/25 disabled:bg-surface-muted',
};

const sizeStyles = {
  sm: 'px-3.5 py-2 text-sm font-medium rounded-full gap-2',
  md: 'px-4.5 py-2.5 text-sm font-semibold rounded-full gap-2',
  lg: 'px-6 py-3.5 text-base font-semibold rounded-full gap-3',
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
        tracking-tight transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-canvas
        disabled:cursor-not-allowed disabled:opacity-60
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
