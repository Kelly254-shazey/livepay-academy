interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  default: 'bg-surface-muted text-text',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent-muted text-accent',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs font-medium',
  md: 'px-3 py-1.5 text-sm font-medium',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-block rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className || ''}
      `}
    >
      {children}
    </span>
  );
}
