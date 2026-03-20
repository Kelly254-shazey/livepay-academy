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
        bg-surface border border-stroke rounded-xl
        transition-all duration-200
        ${interactive ? 'hover:shadow-soft hover:border-accent/30 cursor-pointer hover:-translate-y-0.5' : ''}
        ${noPadding ? '' : 'p-6'}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
}
