interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  noPadding?: boolean;
}

export function Card({
  children,
  className,
  interactive = false,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={`
        glass-card rounded-[28px]
        transition-all duration-300
        ${interactive ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glass-lg hover:border-white/60' : ''}
        ${noPadding ? '' : 'p-6 sm:p-7'}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
}
