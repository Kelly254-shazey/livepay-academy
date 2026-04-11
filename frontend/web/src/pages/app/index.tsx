import { calculateCommission, categories, formatCurrency, platformCommissionRate } from '../../lib/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppShell, PageFrame } from '@/components/layout';
import {
  ManagedContentGrid,
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
  Textarea,
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
  disabled = false,
}: {
  label: string;
  body: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[24px] border border-white/35 bg-white/20 px-4 py-4 backdrop-blur-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm leading-6 text-muted">{body}</p>
      </div>
      <input checked={checked} className="mt-1 h-4 w-4 accent-accent" disabled={disabled} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
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
      if (!session || !result) return;

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
            <Input {...settingsForm.register('email')} placeholder="you@livegate.com" readOnly />
            <p className="text-xs leading-5 text-muted">
              Email changes are locked here and should go through a verified email-change flow.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default role</label>
            <select
              aria-label="Default role"
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
              aria-label="Theme preference"
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
            body="Critical security and system notices stay locked on."
            checked={settingsForm.watch('systemAlerts')}
            label="System alerts"
            onChange={() => undefined}
            disabled
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
          <InlineNotice body={settingsMutation.data?.message ?? ''} title="Settings saved" />
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

function CreatorLiveStudioPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.slug ?? 'education');
  const [sessionType, setSessionType] = useState<'audio' | 'video' | 'both'>('video');
  const [accessMode, setAccessMode] = useState<'paid' | 'free'>('paid');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [price, setPrice] = useState('45');
  const [hostNotes, setHostNotes] = useState('');
  const [message, setMessage] = useState<{ tone: 'default' | 'danger'; title: string; body: string } | null>(null);
  const [createdSession, setCreatedSession] = useState<{
    status: 'draft' | 'published';
    title: string;
    scheduleLabel: string;
    accessPolicy: string;
    deliveryLabel: string;
  } | null>(null);

  const normalizedPrice = accessMode === 'paid' ? Number(price || 0) : 0;
  const commission = normalizedPrice > 0 ? calculateCommission(normalizedPrice) : 0;
  const creatorNet = normalizedPrice > 0 ? normalizedPrice - commission : 0;
  const sessionTypeLabel =
    sessionType === 'audio' ? 'Audio live' : sessionType === 'both' ? 'Audio + video live' : 'Video live';
  const accessPolicy =
    accessMode === 'paid'
      ? 'Users must pay before LiveGate grants room access.'
      : visibility === 'private'
        ? 'Private sessions still require invite-driven access.'
        : 'This session is free to join once visible.';
  const createLiveMutation = useMutation({
    mutationFn: (status: 'draft' | 'published') =>
      webApi.createLiveSession({
        categorySlug: category,
        title: title.trim(),
        description: description.trim(),
        price: normalizedPrice,
        currency: 'USD',
        isPaid: accessMode === 'paid',
        visibility,
        scheduledFor: schedule ? new Date(schedule).toISOString() : undefined,
        sessionType,
        hostNotes: hostNotes.trim() || undefined,
        status,
      }),
    onSuccess: async (_result, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['creator-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['home-feed'] }),
      ]);
      setMessage({
        tone: 'default',
        title: status === 'published' ? 'Live saved and published' : 'Live saved as draft',
        body:
          status === 'published'
            ? 'The live session is now stored with pricing, format, and access settings.'
            : 'The live session is now stored for later review and publishing.',
      });
      setCreatedSession({
        status,
        title: title.trim(),
        scheduleLabel: schedule || 'No schedule entered yet',
        accessPolicy,
        deliveryLabel: sessionTypeLabel,
      });
    },
    onError: (error) => {
      setMessage({
        tone: 'danger',
        title: 'Live save failed',
        body: (error as Error).message,
      });
    },
  });

  const save = (status: 'draft' | 'published') => {
    if (title.trim().length < 5) {
      setMessage({ tone: 'danger', title: 'Live title missing', body: 'Add a clearer live title before continuing.' });
      return;
    }

    if (description.trim().length < 16) {
      setMessage({
        tone: 'danger',
        title: 'Description too short',
        body: 'Give viewers enough detail to understand what the live unlocks.',
      });
      return;
    }

    if (!schedule) {
      setMessage({ tone: 'danger', title: 'Schedule missing', body: 'Add a visible start time or schedule label.' });
      return;
    }

    if (accessMode === 'paid' && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0)) {
      setMessage({
        tone: 'danger',
        title: 'Invalid pricing',
        body: 'Paid lives need a valid checkout amount greater than zero.',
      });
      return;
    }

    createLiveMutation.mutate(status);
  };

  return (
    <Card className="space-y-5">
      <SectionTitle
        body="Create a real live session with audio, video, or both, then store the title, pricing, access rules, and host notes in the studio inventory."
        title="Live studio"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Session title</label>
          <Input onChange={(event) => setTitle(event.target.value)} placeholder="New York open breakdown" value={title} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What will buyers get from this live session?"
            value={description}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Schedule</label>
          <Input onChange={(event) => setSchedule(event.target.value)} type="datetime-local" value={schedule} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            aria-label="Category"
            className="w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition focus:border-white/60 focus:bg-white/40"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Broadcast format</label>
          <div className="flex flex-wrap gap-2">
            {([
              ['video', 'Video live'],
              ['audio', 'Audio live'],
              ['both', 'Audio + video'],
            ] as const).map(([value, label]) => (
              <Button key={value} onClick={() => setSessionType(value)} type="button" variant={sessionType === value ? 'primary' : 'secondary'}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Access model</label>
          <div className="flex flex-wrap gap-2">
            {(['paid', 'free'] as const).map((item) => (
              <Button key={item} onClick={() => setAccessMode(item)} type="button" variant={accessMode === item ? 'primary' : 'secondary'}>
                {item}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility</label>
          <div className="flex flex-wrap gap-2">
            {(['public', 'followers', 'private'] as const).map((item) => (
              <Button key={item} onClick={() => setVisibility(item)} type="button" variant={visibility === item ? 'primary' : 'secondary'}>
                {item}
              </Button>
            ))}
          </div>
        </div>
        {accessMode === 'paid' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Viewer price</label>
            <Input onChange={(event) => setPrice(event.target.value)} placeholder="45" type="number" value={price} />
          </div>
        ) : null}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Host notes</label>
          <Textarea
            onChange={(event) => setHostNotes(event.target.value)}
            placeholder="Optional notes for co-hosts, moderators, or production setup."
            value={hostNotes}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard detail="Total shown to buyers at checkout." label="Price" value={formatCurrency(normalizedPrice || 0)} />
        <StatCard detail="Platform share retained by LiveGate." label="Commission" value={formatCurrency(commission)} />
        <StatCard detail="Creator share after commission." label="Creator net" value={formatCurrency(creatorNet)} />
      </div>
      <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Preview</p>
        <p className="mt-2 text-xl font-semibold">{title || 'Untitled live session'}</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {description || 'Add a fuller description so buyers understand what they are joining.'}
        </p>
        <p className="mt-3 text-sm text-muted">Category: {categories.find((item) => item.slug === category)?.title ?? category}</p>
        <p className="mt-1 text-sm text-muted">Format: {sessionTypeLabel}</p>
        <p className="mt-1 text-sm text-muted">Schedule: {schedule || 'No schedule entered yet'}</p>
        <p className="mt-1 text-sm text-muted">{accessPolicy}</p>
        {hostNotes.trim() ? <p className="mt-1 text-sm text-muted">Host note: {hostNotes.trim()}</p> : null}
      </div>
      {message ? <InlineNotice body={message.body} title={message.title} tone={message.tone} /> : null}
      {createdSession ? (
        <div className="rounded-[24px] border border-white/35 bg-white/18 p-4 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {createdSession.status === 'published' ? 'Published live' : 'Draft live'}
          </p>
          <p className="mt-2 text-lg font-semibold">{createdSession.title}</p>
          <p className="mt-1 text-sm text-muted">{createdSession.deliveryLabel}</p>
          <p className="mt-1 text-sm text-muted">{createdSession.scheduleLabel}</p>
          <p className="mt-1 text-sm text-muted">{createdSession.accessPolicy}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button disabled={createLiveMutation.isPending} onClick={() => save('published')} type="button">
          {createLiveMutation.isPending ? 'Saving...' : 'Publish live'}
        </Button>
        <Button disabled={createLiveMutation.isPending} onClick={() => save('draft')} type="button" variant="secondary">
          Save draft
        </Button>
      </div>
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
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  detail="Live sessions, premium content, and classes already in your library."
                  label="Owned items"
                  value={String(
                    dashboardQuery.data.purchasedLives.items.length +
                      dashboardQuery.data.purchasedContent.items.length +
                      dashboardQuery.data.enrolledClasses.items.length,
                  )}
                />
                <StatCard
                  detail="Creators you already follow and can revisit quickly."
                  label="Following"
                  value={String(dashboardQuery.data.followedCreators.items.length)}
                />
                <StatCard
                  detail="Completed purchase records tied to access."
                  label="Transactions"
                  value={String(dashboardQuery.data.transactions.items.length)}
                />
              </div>
              <Card className="space-y-4">
                <SectionTitle
                  body="The library keeps purchases organized by live sessions, locked content, and classes so returning users can continue quickly."
                  title="Library overview"
                />
                <div className="grid gap-4 lg:grid-cols-3">
                  {dashboardQuery.data.purchasedLives.items.map((item) => (
                    <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl" key={item.id}>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-2 text-sm text-muted">Paid live session</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                  {dashboardQuery.data.purchasedContent.items.map((item) => (
                    <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl" key={item.id}>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-2 text-sm text-muted">Premium content</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                  {dashboardQuery.data.enrolledClasses.items.map((item) => (
                    <div className="rounded-[24px] border border-white/35 bg-white/20 p-4 backdrop-blur-xl" key={item.id}>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-2 text-sm text-muted">Enrolled class</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
              </Card>
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
          <Card className="space-y-4">
            <SectionTitle
              body="Every live, premium content item, and class created in the studio stays visible here with pricing and current status."
              title="Studio inventory"
            />
            <ManagedContentGrid
              emptyBody="Create your first live, premium content item, or class to populate the studio inventory."
              emptyTitle="No studio inventory yet"
              items={query.data.managedContent.items}
            />
          </Card>
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
                  <InlineNotice body={payoutMutation.data?.message ?? ''} title="Payout request submitted" />
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
          <CreatorLiveStudioPanel />
          <ProfileSettingsPanel mode="creator" />
        </>
      ) : null}
    </AppShell>
  );
}

export function AdminDashboardPage() {
  const session = useSessionStore((state) => state.session);
  const isAdmin = session?.user.roles?.includes('admin');
  const isModerator = session?.user.roles?.includes('moderator');
  const query = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: webApi.getAdminDashboard,
  });

  return (
    <AppShell
      sidebarItems={[
        { label: isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard', href: '/dashboard/admin' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'Settings', href: '/settings' },
      ]}
      sidebarTitle={isAdmin ? 'Admin Panel' : 'Moderation'}
    >
      <div className="space-y-8">
        {/* Role-Specific Header */}
        <Card className={`space-y-4 border-2 ${isAdmin ? 'border-accent/30 bg-accent/5' : 'border-warning/30 bg-warning/5'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isAdmin ? '⚙️' : '🛡️'}</span>
                <h1 className="text-3xl font-bold text-text">{isAdmin ? 'Admin Control Center' : 'Moderation Dashboard'}</h1>
              </div>
              <SectionTitle
                body={
                  isAdmin
                    ? 'Monitor platform health, revenue, creator approvals, payments, and category management.'
                    : 'Review flagged content, monitor community safety, and manage creator violations.'
                }
                title=""
              />
            </div>
            <div className="rounded-lg bg-accent/20 px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-accent">{isAdmin ? 'Full Access' : 'Content Moderation'}</p>
            </div>
          </div>
        </Card>

        {query.isLoading ? (
          <LoadingBlock lines={8} />
        ) : query.isError ? (
          <EmptyState title="Dashboard unavailable" body={(query.error as Error).message} />
        ) : query.data ? (
          <>
            {/* Admin-Specific Section */}
            {isAdmin && (
              <>
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-text">Financial Metrics</h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card className="border-l-4 border-success p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Total Revenue</p>
                      <p className="mt-2 text-2xl font-bold text-success">${query.data.totalRevenue.toFixed(2)}</p>
                    </Card>
                    <Card className="border-l-4 border-accent p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Platform Commission</p>
                      <p className="mt-2 text-2xl font-bold text-accent">${query.data.platformCommission.toFixed(2)}</p>
                    </Card>
                    <Card className="border-l-4 border-warning p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Creator Payouts</p>
                      <p className="mt-2 text-2xl font-bold text-warning">${query.data.pendingPayouts.toFixed(2)}</p>
                    </Card>
                  </div>
                </div>

                <div>
                  <h2 className="mb-4 text-xl font-semibold text-text">Platform Growth</h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total Users" value={String(query.data.totalUsers)} />
                    <StatCard label="Creators" value={String(query.data.totalCreators)} />
                    <StatCard label="Active Lives" value={String(query.data.activeLiveSessions)} />
                    <Card className="border-l-4 border-warning p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Pending Approvals</p>
                      <p className="mt-2 text-2xl font-bold text-warning">{query.data.creatorApprovals}</p>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* Moderator-Specific Section */}
            {isModerator && (
              <>
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-text">Community Safety</h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card className="border-l-4 border-danger p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Flagged Content</p>
                      <p className="mt-2 text-2xl font-bold text-danger">{query.data.flaggedContent}</p>
                    </Card>
                    <Card className="border-l-4 border-warning p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Suspicious Payments</p>
                      <p className="mt-2 text-2xl font-bold text-warning">{query.data.suspiciousPayments}</p>
                    </Card>
                    <Card className="border-l-4 border-accent p-4">
                      <p className="text-xs uppercase tracking-wider text-muted">Pending Reviews</p>
                      <p className="mt-2 text-2xl font-bold text-accent">{Math.max(query.data.creatorApprovals, 0)}</p>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* Shared Metrics */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-text">Platform Overview</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-accent p-4">
                  <p className="text-xs uppercase tracking-wider text-muted">Active Categories</p>
                  <p className="mt-2 text-2xl font-bold text-text">{categories.length}</p>
                </Card>
                <Card className="border-l-4 border-success p-4">
                  <p className="text-xs uppercase tracking-wider text-muted">Live Sessions Running</p>
                  <p className="mt-2 text-2xl font-bold text-success">{query.data.activeLiveSessions}</p>
                </Card>
                <Card className="border-l-4 border-warning p-4">
                  <p className="text-xs uppercase tracking-wider text-muted">Action Items</p>
                  <p className="mt-2 text-2xl font-bold text-warning">{query.data.creatorApprovals + query.data.flaggedContent}</p>
                </Card>
              </div>
            </div>
            <Card className="space-y-4">
              <SectionTitle
                body="Every created live, premium content item, and class appears here with the creator-set price so admins and moderators can review it after creation."
                title="Created content and pricing"
              />
              <ManagedContentGrid
                emptyBody="Created lives, premium content, and classes will appear here once creators begin publishing."
                emptyTitle="No managed content yet"
                items={query.data.managedContent.items}
                showCreator
              />
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard/user');
    }
  };

  return (
    <PageFrame>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        {/* Back Button & Header */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg border border-stroke/30 bg-surface/50 px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surface hover:text-text"
          >
            ← Back
          </button>
          <div className="rounded-lg bg-accent/10 px-3 py-1">
            <p className="text-xs uppercase tracking-wider text-accent">Checkout</p>
          </div>
        </div>

        <Card className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-text">Checkout Session</h1>
            <p className="mt-2 text-muted">Review your purchase and complete payment securely</p>
          </div>
          {hasProduct ? (
            <>
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

              {/* Role-Specific Benefits */}
              {session?.user && (
                <div className="rounded-lg border-l-4 border-accent/30 bg-accent/5 p-4">
                  <p className="text-sm font-semibold text-text">Your Purchase Includes:</p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted">
                      <span className="text-accent">✓</span>
                      Lifetime access to content
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted">
                      <span className="text-accent">✓</span>
                      Download for offline viewing
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted">
                      <span className="text-accent">✓</span>
                      HD quality streaming
                    </li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              body="Open checkout from a live session, premium content card, or class details page so the route has a valid product context."
              title="No checkout target selected"
              action={
                <Button onClick={handleBack} variant="secondary">
                  Go Back
                </Button>
              }
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={!hasProduct || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Preparing checkout quote...' : 'Prepare checkout quote'}
            </Button>
          </div>
          {mutation.isSuccess && mutation.data ? (
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
              <InlineNotice
                body={
                  mutation.data.paymentProcessingAvailable
                    ? 'Verified payment confirmation is available for this checkout session.'
                    : 'Checkout quoting is available, but payment confirmation stays disabled until a provider webhook flow is integrated.'
                }
                title={mutation.data.paymentProcessingAvailable ? 'Checkout ready' : 'Provider verification pending'}
                tone={mutation.data.paymentProcessingAvailable ? 'default' : 'danger'}
              />
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
