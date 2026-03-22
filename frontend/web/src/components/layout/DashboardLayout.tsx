import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  badge?: string;
}

function NavItem({ to, icon, label, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-accent text-white' 
          : 'text-text-secondary hover:text-text hover:bg-hover'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-xs bg-surface-muted text-text-muted rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

function DefaultSidebar() {
  const session = useSessionStore((state) => state.session);
  const isCreator = session?.user?.role === 'creator';

  const navItems = isCreator ? [
    { to: '/dashboard', icon: '📊', label: 'Overview' },
    { to: '/dashboard/lives', icon: '🔴', label: 'Live Sessions' },
    { to: '/dashboard/content', icon: '📄', label: 'Content' },
    { to: '/dashboard/classes', icon: '🎓', label: 'Classes' },
    { to: '/dashboard/earnings', icon: '💰', label: 'Earnings' },
    { to: '/dashboard/analytics', icon: '📈', label: 'Analytics' },
  ] : [
    { to: '/dashboard', icon: '🏠', label: 'Home' },
    { to: '/dashboard/library', icon: '📚', label: 'Library' },
    { to: '/dashboard/following', icon: '👥', label: 'Following' },
    { to: '/dashboard/purchases', icon: '🛒', label: 'Purchases' },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <h1 className="font-semibold text-text">LiveGate</h1>
            <p className="text-xs text-text-muted capitalize">{session?.user?.role || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover">
          <div className="w-8 h-8 bg-surface-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-text-secondary">
              {session?.user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {session?.user?.fullName || 'User'}
            </p>
            <p className="text-xs text-text-muted truncate">
              {session?.user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas flex">
      {sidebar || <DefaultSidebar />}
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}