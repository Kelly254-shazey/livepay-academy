import { type ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionStyles = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
};

const arrowStyles = {
  top: 'top-full border-t-surface border-l-transparent border-r-transparent',
  bottom: 'bottom-full border-b-surface border-l-transparent border-r-transparent',
  left: 'left-full border-l-surface border-t-transparent border-b-transparent',
  right: 'right-full border-r-surface border-t-transparent border-b-transparent',
};

export function Tooltip({
  text,
  children,
  position = 'top',
}: TooltipProps) {
  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`
          absolute ${positionStyles[position]}
          hidden group-hover:block
          bg-surface text-text text-sm rounded-md px-2 py-1 whitespace-nowrap
          z-50 pointer-events-none
          shadow-lg
        `}
      >
        {text}
        <div
          className={`absolute w-0 h-0 border-4 ${arrowStyles[position]}`}
        />
      </div>
    </div>
  );
}
