import { type ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  icon?: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

export function NavLink({
  href,
  icon,
  label,
  active = false,
  badge,
  onClick,
}: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-200
        ${active
          ? 'bg-accent/10 text-accent font-medium'
          : 'text-muted hover:text-text hover:bg-surface-muted'
        }
      `}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {badge ? (
        <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-surface bg-accent rounded-full">
          {badge}
        </span>
      ) : null}
    </a>
  );
}
