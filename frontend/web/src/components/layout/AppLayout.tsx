import { type ReactNode } from 'react';
import { Container } from '../ui/Container';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

export function AppLayout({ children, sidebar, header }: LayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      {header}
      <div className="flex">
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-stroke bg-surface fixed left-0 top-0 h-screen overflow-y-auto pt-20">
            {sidebar}
          </aside>
        )}
        <main className={sidebar ? 'lg:ml-64 w-full' : 'w-full'}>
          <Container className="py-8 min-h-[calc(100vh-80px)]">
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
}
