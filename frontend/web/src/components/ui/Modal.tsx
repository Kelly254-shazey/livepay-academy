import { type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: Array<{ label: string; onClick: () => void; variant?: string }>;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  closeButton?: boolean;
}

const sizeStyles = {
  sm: 'w-full sm:max-w-sm',
  md: 'w-full sm:max-w-md',
  lg: 'w-full sm:max-w-lg',
};

export function Modal({
  isOpen,
  title,
  children,
  footer,
  actions,
  onClose,
  size = 'md',
  closeButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={`relative ${sizeStyles[size]} bg-surface rounded-xl shadow-2xl`}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-stroke">
            {title && (
              <h2 className="text-lg font-semibold text-text">{title}</h2>
            )}
            {closeButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                title="Close modal"
                className="ml-auto p-1 rounded-lg hover:bg-surface-muted transition-colors"
              >
                <svg
                  className="w-5 h-5 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {(footer || actions) && (
          <div className="px-6 py-4 border-t border-stroke flex items-center justify-end gap-2">
            {footer || (
              <>
                {actions?.map((action) => (
                  <Button
                    key={action.label}
                    variant={
                      action.variant as
                        | 'primary'
                        | 'secondary'
                        | 'ghost'
                        | undefined
                    }
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
