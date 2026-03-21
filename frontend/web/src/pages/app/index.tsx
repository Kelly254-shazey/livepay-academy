import { calculateCommission, categories, formatCurrency, platformCommissionRate } from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AppShell, PageFrame } from '@/components/layout';
import {
  NotificationsPanel,
  TransactionTable,
  WalletSummaryCards,
} from '@/components/domain';
import { webApi } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  InlineNotice,
  Input,
  LoadingBlock,
  SectionTitle,
  StatCard,
  Tabs,
} from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

const payoutSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().min(2),
  note: z.string().optional(),
});

const settingsSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  defaultRole: z.enum(['viewer', 'creator', 'moderator', 'admin']),
  liveReminders: z.boolean(),
  purchaseUpdates: z.boolean(),
  creatorAnnouncements: z.boolean(),
  systemAlerts: z.boolean(),
  theme: z.enum(['system', 'light', 'dark']),
  compactMode: z.boolean(),
  publicCreatorProfile: z.boolean(),
  communityVisibility: z.boolean(),
  payoutMethod: z.string().optional(),
  payoutNote: z.string().optional(),
});

function SettingsToggle({
  label,
  body,
  checked,
  onChange,
}: {
  label: string;
  body: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[24px] border border-white/35 bg-white/20 px-4 py-4 backdrop-blur-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm leading-6 text-muted">{body}</p>
      </div>
      <input checked={checked} className="mt-1 h-4 w-4 accent-accent" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function ProfileSettingsPanel({ mode }: { mode: 'viewer' | 'creator' }) {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const settingsQuery = useQuery({
    queryKey: ['profile-settings', session?.user.id, mode],
    queryFn: webApi.getProfileSettings,
    enabled: Boolean(session),
  });
  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: session?.user.fullName ?? '',
      email: session?.user.email ?? '',
      defaultRole: session?.user.role ?? 'viewer',
      liveReminders: true,
      purchaseUpdates: true,
      creatorAnnouncements: true,
      systemAlerts: true,
      theme: 'system',
      compactMode: false,
      publicCreatorProfile: mode === 'creator',
      communityVisibility: true,
      payoutMethod: '',
      payoutNote: '',
    },
  });
  const settingsMutation = useMutation({
    mutationFn: webApi.saveProfileSettings,
    onSuccess: (result) => {
      if (!session) return;

      setPreferredRoles(result.settings.roles, result.settings.defaultRole);
      setSession({
        ...session,
        activeRole: result.settings.defaultRole,
        user: {
          ...session.user,
          fullName: result.settings.fullName,
          email: result.settings.email,
          role: result.settings.defaultRole,
          roles: result.settings.roles,
        },
      });
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;

    settingsForm.reset({
      fullName: settingsQuery.data.fullName,
      email: settingsQuery.data.email,
      defaultRole: settingsQuery.data.defaultRole,
      liveReminders: settingsQuery.data.notificationPreferences.liveReminders,
      purchaseUpdates: settingsQuery.data.notificationPreferences.purchaseUpdates,
      creatorAnnouncements: settingsQuery.data.notificationPreferences.creatorAnnouncements,
      systemAlerts: settingsQuery.data.notificationPreferences.systemAlerts,
      theme: settingsQuery.data.appearancePreferences.theme,
      compactMode: settingsQuery.data.appearancePreferences.compactMode,
      publicCreatorProfile: settingsQuery.data.privacyPreferences.publicCreatorProfile,
      communityVisibility: settingsQuery.data.privacyPreferences.communityVisibility,
      payoutMethod: settingsQuery.data.payoutPreferences?.method ?? '',
      payoutNote: settingsQuery.data.payoutPreferences?.note ?? '',
    });
  }, [settingsForm, settingsQuery.data]);

  if (settingsQuery.isLoading) {
    return <LoadingBlock lines={8} />;
  }

  if (settingsQuery.isError) {
    return <EmptyState body={(settingsQuery.error as Error).message} title="Settings unavailable" />;
  }

  const availableRoles = Array.from(new Set(session?.user.roles?.length ? session.user.roles : [session?.user.role ?? 'viewer']));

  return (
    <Card className="space-y-5">
      <SectionTitle
        body={
          mode === 'creator'
            ? 'Manage creator-facing visibility, payout defaults, notifications, and role preference from one surface.'
            : 'Keep account identity, notification preferences, appearance, and privacy controls in one calm settings panel.'
        }
        title={mode === 'creator' ? 'Creator settings' : 'Profile settings'}
      />
      <form
        className="space-y-5"
        onSubmit={settingsForm.handleSubmit((values) =>
          settingsMutation.mutate({
            fullName: values.fullName,
            email: values.email,
            roles: availableRoles,
            defaultRole: values.defaultRole,
            notificationPreferences: {
              liveReminders: values.liveReminders,
              purchaseUpdates: values.purchaseUpdates,
              creatorAnnouncements: values.creatorAnnouncements,
              systemAlerts: values.systemAlerts,
            },
            appearancePreferences: {
              theme: values.theme,
              compactMode: values.compactMode,
            },
            privacyPreferences: {
              publicCreatorProfile: values.publicCreatorProfile,
              communityVisibility: values.communityVisibility,
            },
            payoutPreferences:
              mode === 'creator'
                ? {
                    method: values.payoutMethod ?? '',
                    note: values.payoutNote,
                  }
                : undefined,
          }),
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full name</label>
            <Input {...settingsForm.register('fullName')} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input {...settingsForm.register('email')} placeholder="you@livegate.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default role</label>
            <select
              className="w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition focus:border-white/60 focus:bg-white/40"
              {...settingsForm.register('defaultRole')}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme preference</label>
            <select
              className="w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition focus:border-white/60 focus:bg-white/40"
              {...settingsForm.register('theme')}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          {mode === 'creator' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred payout method</label>
                <Input {...settingsForm.register('payoutMethod')} placeholder="Bank transfer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payout note</label>
                <Input {...settingsForm.register('payoutNote')} placeholder="Optional payout note" />
              </div>
            </>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SettingsToggle
            body="Receive timing alerts before purchased or followed live sessions begin."
            checked={settingsForm.watch('liveReminders')}
            label="Live reminders"
            onChange={(value) => settingsForm.setValue('liveReminders', value)}
          />
          <SettingsToggle
            body="See successful purchases, unlock confirmations, and transaction-level updates."
            checked={settingsForm.watch('purchaseUpdates')}
            label="Purchase updates"
            onChange={(value) => settingsForm.setValue('purchaseUpdates', value)}
          />
          <SettingsToggle
            body="Allow creator announcements and class publishing notices in your feed."
            checked={settingsForm.watch('creatorAnnouncements')}
            label="Creator announcements"
            onChange={(value) => settingsForm.setValue('creatorAnnouncements', value)}
          />
          <SettingsToggle
            body="Keep account, moderation, and security notices enabled."
            checked={settingsForm.watch('systemAlerts')}
            label="System alerts"
            onChange={(value) => settingsForm.setValue('systemAlerts', value)}
          />
          <SettingsToggle
            body="Use tighter spacing for denser dashboard views."
            checked={settingsForm.watch('compactMode')}
            label="Compact layout"
            onChange={(value) => settingsForm.setValue('compactMode', value)}
          />
          <SettingsToggle
            body="Stay visible within creator discovery and community surfaces."
            checked={settingsForm.watch('communityVisibility')}
            label="Community visibility"
            onChange={(value) => settingsForm.setValue('communityVisibility', value)}
          />
          {mode === 'creator' ? (
            <SettingsToggle
              body="Let your creator profile remain publicly discoverable."
              checked={settingsForm.watch('publicCreatorProfile')}
              label="Public creator profile"
              onChange={(value) => settingsForm.setValue('publicCreatorProfile', value)}
            />
          ) : null}
        </div>

        {settingsMutation.isSuccess ? (
          <InlineNotice body={settingsMutation.data.message} title="Settings saved" />
        ) : null}
        {settingsMutation.isError ? (
          <InlineNotice body={(settingsMutation.error as Error).message} title="Settings failed" tone="danger" />
        ) : null}

        <Button disabled={settingsMutation.isPending} type="submit">
          {settingsMutation.isPending ? 'Saving settings...' : 'Save settings'}
        </Button>
      </form>
    </Card>
  );
}

export function UserDashboardPage() {
  const [tab, setTab] = useState('purchases');
  const dashboardQuery = useQuery({
    queryKey: ['viewer-dashboard'],
    queryFn: webApi.getViewerDashboard,
  });

  const tabs = [
    { label: 'Purchases', value: 'purchases' },
    { label: 'Following', value: 'following' },
    { label: 'Transactions', value: 'transactions' },
    { label: 'Settings', value: 'settings' },
  ];

  return (
    <AppShell
      sidebarItems={[
        { label: 'Viewer Dashboard', href: '/dashboard/user' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'Checkout', href: '/checkout' },
      ]}
      sidebarTitle="Viewer"
    >
      <Card className="space-y-4">
        <SectionTitle
          body="Track purchased lives, unlocked content, classes, followed creators, notifications, and profile settings from one calm surface."
          title="Viewer dashboard"
        />
        <Tabs items={tabs} onChange={setTab} value={tab} />
      </Card>

      {dashboardQuery.isLoading ? (
        <LoadingBlock lines={8} />
      ) : dashboardQuery.isError ? (
        <EmptyState title="Dashboard unavailable" body={(dashboardQuery.error as Error).message} />
      ) : dashboardQuery.data ? (
        <>
          {tab === 'purchases' ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {dashboardQuery.data.purchasedLives.items.map((item) => (
                <Card key={item.id}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-muted">Paid live session</p>
                </Card>
              ))}
              {dashboardQuery.data.purchasedContent.items.map((item) => (
                <Card key={item.id}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-muted">Premium content</p>
                </Card>
              ))}
              {dashboardQuery.data.enrolledClasses.items.map((item) => (
                <Card key={item.id}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-muted">Enrolled class</p>
                </Card>
              ))}
            </div>
          ) : null}

          {tab === 'following' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {dashboardQuery.data.followedCreators.items.length ? (
                dashboardQuery.data.followedCreators.items.map((item) => (
                  <Card key={item.id}>
                    <p className="text-lg font-semibold">{item.displayName}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.headline}</p>
                  </Card>
                ))
              ) : (
                <EmptyState
                  title="No followed creators yet"
                  body="Follow relationships will render here after backend integration returns them."
                />
              )}
            </div>
          ) : null}

          {tab === 'transactions' ? (
            <TransactionTable items={dashboardQuery.data.transactions.items} />
          ) : null}

          {tab === 'settings' ? (
            <ProfileSettingsPanel mode="viewer" />
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}

export function CreatorDashboardPage() {
  const query = useQuery({
    queryKey: ['creator-dashboard'],
    queryFn: webApi.getCreatorDashboard,
  });
  const form = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { amount: 0, method: '', note: '' },
  });
  const payoutMutation = useMutation({
    mutationFn: webApi.requestPayout,
  });

  return (
    <AppShell
      sidebarItems={[
        { label: 'Creator Dashboard', href: '/dashboard/creator' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'Checkout', href: '/checkout' },
      ]}
      sidebarTitle="Creator"
    >
      <Card className="space-y-4">
        <SectionTitle
          body="Available balance, pending balance, earnings, payout request flow, verification state, and recent transactions all connect from here."
          title="Creator dashboard"
        />
      </Card>

      {query.isLoading ? (
        <LoadingBlock lines={8} />
      ) : query.isError ? (
        <EmptyState title="Creator dashboard unavailable" body={(query.error as Error).message} />
      ) : query.data ? (
        <>
          <WalletSummaryCards wallet={query.data.wallet} />
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard detail="Current verification state" label="Verification" value={query.data.verificationStatus} />
            <StatCard detail="Connected follower count" label="Followers" value={String(query.data.followers)} />
            <StatCard
              detail={`${platformCommissionRate * 100}% platform commission enforced`}
              label="Commission logic"
              value={formatCurrency(calculateCommission(query.data.wallet.lifetimeEarnings), query.data.wallet.currency)}
            />
          </div>
          <TransactionTable items={query.data.recentTransactions.items} />
          <Card className="space-y-4">
            <SectionTitle
              title="Request payout"
              body="Creators receive 80% of successful transactions while LiveGate retains the platform commission. This form is wired to the payout endpoint."
            />
            <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit((values) => payoutMutation.mutate(values))}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input {...form.register('amount')} placeholder="250" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Method</label>
                <Input {...form.register('method')} placeholder="Bank transfer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note</label>
                <Input {...form.register('note')} placeholder="Optional note" />
              </div>
              <div className="md:col-span-3">
                {payoutMutation.isSuccess ? (
                  <InlineNotice body={payoutMutation.data.message} title="Payout request submitted" />
                ) : null}
                {payoutMutation.isError ? (
                  <InlineNotice body={(payoutMutation.error as Error).message} title="Payout failed" tone="danger" />
                ) : null}
              </div>
              <div className="md:col-span-3">
                <Button disabled={payoutMutation.isPending} type="submit">
                  {payoutMutation.isPending ? 'Submitting...' : 'Request payout'}
                </Button>
              </div>
            </form>
          </Card>
          <ProfileSettingsPanel mode="creator" />
        </>
      ) : null}
    </AppShell>
  );
}

export function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: webApi.getAdminDashboard,
  });

  return (
    <AppShell
      sidebarItems={[
        { label: 'Admin Dashboard', href: '/dashboard/admin' },
        { label: 'Notifications', href: '/notifications' },
      ]}
      sidebarTitle="Admin"
    >
      <Card className="space-y-4">
        <SectionTitle
          body="Monitor platform health, live session activity, payouts, creator approvals, flagged content, suspicious payments, and category management."
          title="Admin dashboard"
        />
      </Card>
      {query.isLoading ? (
        <LoadingBlock lines={8} />
      ) : query.isError ? (
        <EmptyState title="Admin dashboard unavailable" body={(query.error as Error).message} />
      ) : query.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Users" value={String(query.data.totalUsers)} />
            <StatCard label="Creators" value={String(query.data.totalCreators)} />
            <StatCard label="Active lives" value={String(query.data.activeLiveSessions)} />
            <StatCard label="Revenue" value={formatCurrency(query.data.totalRevenue)} />
            <StatCard label="Commission" value={formatCurrency(query.data.platformCommission)} />
            <StatCard label="Pending payouts" value={String(query.data.pendingPayouts)} />
            <StatCard label="Approvals" value={String(query.data.creatorApprovals)} />
            <StatCard label="Flagged content" value={String(query.data.flaggedContent)} />
          </div>
          <Card>
            <p className="text-sm leading-7 text-muted">
              Suspicious payments currently tracked: {query.data.suspiciousPayments}. Category
              catalog contains {categories.length} canonical product categories.
            </p>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}

export function CheckoutPage() {
  const [params] = useSearchParams();
  const productId = params.get('productId');
  const productType = params.get('productType') as 'live' | 'content' | 'class' | null;
  const hasProduct = Boolean(productId && productType);
  const mutation = useMutation({
    mutationFn: () =>
      webApi.createCheckout({
        productId: productId ?? '',
        productType: productType ?? 'live',
      }),
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <Card className="space-y-5">
          <SectionTitle
            body="Create a secure checkout session, review the purchase summary, and confirm the platform-versus-creator breakdown before payment."
            title="Checkout session"
          />
          {hasProduct ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Product type</p>
                <p className="mt-2 text-lg font-semibold capitalize">{productType}</p>
              </div>
              <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Product id</p>
                <p className="mt-2 text-lg font-semibold">{productId}</p>
              </div>
            </div>
          ) : (
            <EmptyState
              body="Open checkout from a live session, premium content card, or class details page so the route has a valid product context."
              title="No checkout target selected"
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={!hasProduct || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Creating checkout...' : 'Create secure checkout session'}
            </Button>
            {hasProduct ? (
              <Link to={`/payment/failed?productType=${productType}&productId=${productId}`}>
                <Button variant="ghost">Preview failure state</Button>
              </Link>
            ) : null}
          </div>
          {mutation.isSuccess ? (
            <div className="space-y-4">
              <InlineNotice
                body={`Checkout prepared for ${mutation.data.title} at ${formatCurrency(mutation.data.totalAmount ?? mutation.data.amount, mutation.data.currency)}.`}
                title="Checkout session ready"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Session id</p>
                  <p className="mt-2 text-lg font-semibold">{mutation.data.id}</p>
                  <p className="mt-2 text-sm text-muted">{mutation.data.accessPolicy}</p>
                </div>
                <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Creator</p>
                  <p className="mt-2 text-lg font-semibold">{mutation.data.creatorName ?? 'LiveGate creator'}</p>
                  <p className="mt-2 text-sm text-muted">Category: {mutation.data.category ?? 'not set'}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  detail="User-facing checkout amount."
                  label="Total"
                  value={formatCurrency(mutation.data.totalAmount ?? mutation.data.amount, mutation.data.currency)}
                />
                <StatCard
                  detail="Platform share retained by LiveGate."
                  label="Platform commission"
                  value={formatCurrency(mutation.data.platformCommissionAmount ?? 0, mutation.data.currency)}
                />
                <StatCard
                  detail="Creator share after commission."
                  label="Creator earnings"
                  value={formatCurrency(mutation.data.creatorEarningsAmount ?? 0, mutation.data.currency)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={`/payment/success?productType=${productType}&productId=${productId}`}>
                  <Button>Preview success state</Button>
                </Link>
                <Button onClick={() => mutation.mutate()} variant="secondary">
                  Recreate session
                </Button>
              </div>
            </div>
          ) : null}
          {mutation.isError ? (
            <InlineNotice body={(mutation.error as Error).message} title="Checkout failed" tone="danger" />
          ) : null}
        </Card>
      </div>
    </PageFrame>
  );
}

export function PaymentSuccessPage() {
  return (
    <PageFrame>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <Card className="space-y-4">
          <SectionTitle
            title="Payment successful"
            body="This route is ready for post-payment confirmation, transaction snapshots, and immediate access updates."
          />
          <Link to="/dashboard/user">
            <Button>Go to dashboard</Button>
          </Link>
        </Card>
      </div>
    </PageFrame>
  );
}

export function PaymentFailedPage() {
  return (
    <PageFrame>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <Card className="space-y-4">
          <SectionTitle
            title="Payment failed"
            body="Use this route for retry guidance, failure diagnostics, and support handoff once your payment provider is connected."
          />
          <Link to="/checkout">
            <Button>Try again</Button>
          </Link>
        </Card>
      </div>
    </PageFrame>
  );
}

export function NotificationsCenterPage() {
  const query = useQuery({
    queryKey: ['notifications-center'],
    queryFn: webApi.getNotifications,
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <SectionTitle
          body="Live reminders, purchases, creator announcements, and payout updates converge here."
          title="Notifications center"
        />
        {query.isLoading ? (
          <LoadingBlock lines={8} />
        ) : query.isError ? (
          <EmptyState title="Notifications unavailable" body={(query.error as Error).message} />
        ) : (
          <NotificationsPanel items={query.data?.items ?? []} />
        )}
      </div>
    </PageFrame>
  );
}
