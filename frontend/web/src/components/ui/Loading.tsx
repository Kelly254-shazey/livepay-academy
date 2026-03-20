interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Loading({ size = 'md', fullPage = false }: LoadingProps) {
  const spinner = (
    <div className="flex items-center justify-center">
      <svg
        className={`${sizeStyles[size]} animate-spin text-accent`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
