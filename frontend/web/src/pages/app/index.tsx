import { calculateCommission, categories, formatCurrency, platformCommissionRate } from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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

const payoutSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().min(2),
  note: z.string().optional(),
});

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
            <Card className="space-y-4">
              <SectionTitle
                title="Profile settings"
                body="Personalization, notification preferences, and account controls can mount here on top of the existing auth/session store."
              />
              <InlineNotice
                body="This dashboard is ready for profile forms once the settings endpoints are available."
                title="Settings placeholder"
              />
            </Card>
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
        <Card className="space-y-4">
          <SectionTitle
            body="This checkout surface is prepared for real payment sessions, summaries, success redirects, and failure recovery."
            title="Checkout"
          />
          <p className="text-sm text-muted">
            Product type: {productType ?? 'not provided'} | Product id: {productId ?? 'not provided'}
          </p>
          <Button disabled={!productId || !productType || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Creating checkout...' : 'Create checkout session'}
          </Button>
          {mutation.isSuccess ? (
            <InlineNotice
              body={`Checkout prepared for ${mutation.data.title} at ${formatCurrency(mutation.data.amount, mutation.data.currency)}.`}
              title="Transaction summary"
            />
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
