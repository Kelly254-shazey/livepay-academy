import { type PropsWithChildren } from 'react';

interface GridProps extends PropsWithChildren {
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  responsive?: boolean;
}

const colStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const gapStyles = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

export function Grid({
  children,
  cols = 1,
  gap = 'md',
  className,
  responsive = true,
}: GridProps) {
  return (
    <div
      className={`
        grid
        ${responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : colStyles[cols]}
        ${gapStyles[gap]}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
}
