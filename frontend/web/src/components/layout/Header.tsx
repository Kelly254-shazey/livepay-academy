import { type PropsWithChildren } from 'react';

interface HeaderProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  nav?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  action,
  nav,
  children,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-stroke/30">
      <nav className="px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-lg">
        {nav}
      </nav>
      {title && (
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-t border-stroke/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-text tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-lg text-muted">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </div>
      )}
      {children}
    </header>
  );
}
