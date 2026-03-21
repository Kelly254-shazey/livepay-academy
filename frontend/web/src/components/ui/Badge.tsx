interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  default: 'border-white/35 bg-white/20 text-text',
  success: 'border-success/20 bg-success/12 text-success',
  warning: 'border-warning/20 bg-warning/12 text-warning',
  danger: 'border-danger/20 bg-danger/12 text-danger',
  accent: 'border-accent/20 bg-accent/12 text-accent',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
  md: 'px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]',
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
        inline-flex items-center rounded-full border
        shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
        backdrop-blur-xl
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className || ''}
      `}
    >
      {children}
    </span>
  );
}
