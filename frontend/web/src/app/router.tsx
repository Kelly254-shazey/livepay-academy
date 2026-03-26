import type { UserRole } from '../lib/shared';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { AdminDashboardPage, CheckoutPage, CreatorDashboardPage, NotificationsCenterPage, PaymentFailedPage, PaymentSuccessPage, UserDashboardPage } from '@/pages/app';
import { ForgotPasswordPage, ResetPasswordPage, RoleSelectionPage, SignInPage, SignUpPage, StaffAccessPage } from '@/pages/auth';
import { CategoryPage, ClassDetailsPage, CreatorProfilePage, LiveDetailsPage, LiveRoomPage, PremiumContentPage } from '@/pages/discovery';
import { LandingPage } from '@/pages/public';

function ProtectedRoute({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: ReactNode;
}) {
  const session = useSessionStore((state) => state.session);

  if (!session) {
    return <Navigate replace to="/auth/sign-in" />;
  }

  if (roles && !roles.includes(session.user.role)) {
    return <Navigate replace to={dashboardPathForRole(session.user.role)} />;
  }

  return <>{children}</>;
}

function dashboardPathForRole(role: UserRole) {
  if (role === 'creator') return '/dashboard/creator';
  if (role === 'admin' || role === 'moderator') return '/dashboard/admin';
  return '/dashboard/user';
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/auth/role-selection', element: <RoleSelectionPage /> },
  { path: '/auth/sign-in', element: <SignInPage /> },
  { path: '/auth/sign-up', element: <SignUpPage /> },
  { path: '/staff/portal', element: <StaffAccessPage /> },
  { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/auth/reset-password', element: <ResetPasswordPage /> },
  { path: '/categories/:slug', element: <CategoryPage /> },
  { path: '/creators/:creatorId', element: <CreatorProfilePage /> },
  { path: '/lives/:liveId', element: <LiveDetailsPage /> },
  {
    path: '/lives/:liveId/room',
    element: (
      <ProtectedRoute roles={['viewer', 'creator', 'admin', 'moderator']}>
        <LiveRoomPage />
      </ProtectedRoute>
    ),
  },
  { path: '/content/:contentId', element: <PremiumContentPage /> },
  { path: '/classes/:classId', element: <ClassDetailsPage /> },
  {
    path: '/dashboard/user',
    element: (
      <ProtectedRoute roles={['viewer']}>
        <UserDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/creator',
    element: (
      <ProtectedRoute roles={['creator']}>
        <CreatorDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin',
    element: (
      <ProtectedRoute roles={['admin', 'moderator']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsCenterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    ),
  },
  { path: '/payment/success', element: <PaymentSuccessPage /> },
  { path: '/payment/failed', element: <PaymentFailedPage /> },
]);
