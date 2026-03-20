import { type ReactNode } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: 'left' | 'right';
}

export function Sidebar({
  isOpen,
  onClose,
  children,
  position = 'left',
}: SidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-text/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Sidebar"
        className={`
          fixed top-0 ${position}-0 h-screen w-64 bg-surface border-r border-stroke
          z-50 lg:relative lg:translate-x-0 lg:inset-auto
          transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : (position === 'left' ? '-translate-x-full' : 'translate-x-full')}
        `}
      >
        <div className="p-4">
          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-surface-muted rounded-lg"
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

          {/* Content */}
          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
      </aside>
    </>
  );
}
