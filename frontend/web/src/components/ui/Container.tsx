import { type PropsWithChildren } from 'react';

interface ContainerProps extends PropsWithChildren {
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

const maxWidthStyles = {
  sm: 'max-w-600px',
  md: 'max-w-768px',
  lg: 'max-w-1024px',
  xl: 'max-w-1280px',
  '2xl': 'max-w-1536px',
  full: 'w-full',
};

export function Container({
  children,
  className,
  maxWidth = 'xl',
  padding = true,
}: ContainerProps) {
  return (
    <div
      className={`
        mx-auto w-full
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${maxWidthStyles[maxWidth]}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
}
