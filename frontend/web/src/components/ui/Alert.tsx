interface AlertProps {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const typeStyles = {
  info: 'bg-accent/10 border-accent/30 text-accent',
  success: 'bg-success/10 border-success/30 text-success',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  error: 'bg-danger/10 border-danger/30 text-danger',
};

export function Alert({
  children,
  type = 'info',
  icon,
  onClose,
  className,
}: AlertProps) {
  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border
        ${typeStyles[type]}
        ${className || ''}
      `}
    >
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-75 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
