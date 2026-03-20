interface StatProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  icon?: React.ReactNode;
}

export function Stat({ label, value, change, icon }: StatProps) {
  return (
    <div className="rounded-lg border-2 border-stroke bg-surface p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm sm:text-base text-muted">{label}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-text">
            {value}
          </p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 text-xs sm:text-sm font-medium ${
                  change.trend === 'up'
                    ? 'text-success'
                    : 'text-error'
                }`}
              >
                {change.trend === 'up' ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 7H12z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v3.586l4.293-4.293a1 1 0 011.414 1.414L9.414 13H12z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {Math.abs(change.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-accent/50 w-8 h-8 sm:w-12 sm:h-12">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
