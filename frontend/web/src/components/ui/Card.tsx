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
        card
        ${interactive ? 'card-interactive' : ''}
        ${noPadding ? '' : 'p-6'}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
}
