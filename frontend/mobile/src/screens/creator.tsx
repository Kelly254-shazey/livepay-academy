import Ionicons from '@expo/vector-icons/Ionicons';
import type { ProfileSettingsPayload } from '@livegate/shared';
import { categories, formatCurrency, getSessionRoles } from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import {
  CategoryChip,
  ClassCard,
  ContentCard,
  LiveCard,
  NotificationRow,
  TransactionRow,
  WalletCards,
} from '@/components/cards';
import {
  Button,
  EmptyState,
  Heading,
  LoadingState,
  Screen,
  Surface,
  TextField,
} from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';

const payoutSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().min(2),
  note: z.string().optional(),
});

const appearanceModes = ['system', 'light', 'dark'] as const;
const visibilityModes = [
  {
    value: 'public',
    title: 'Public',
    body: 'Visible in discovery and category browse surfaces.',
  },
  {
    value: 'followers',
    title: 'Followers',
    body: 'Focused on your existing audience and community.',
  },
  {
    value: 'private',
    title: 'Private',
    body: 'Invite-only access with tighter entry control.',
  },
] as const;
const accessModes = [
  {
    value: 'paid',
    title: 'Paid',
    body: 'Users must pay before LiveGate issues access.',
  },
  {
    value: 'free',
    title: 'Free',
    body: 'Open entry while still enforcing room visibility rules.',
  },
] as const;

type VisibilityMode = (typeof visibilityModes)[number]['value'];
type AccessMode = (typeof accessModes)[number]['value'];

function formatRoleLabel(role: string) {
  if (role === 'creator') return 'Content Creator';
  if (role === 'viewer') return 'Viewer';
  if (role === 'moderator') return 'Moderator';
  if (role === 'admin') return 'Admin';
  return role;
}

function SettingsToggle({
  title,
  body,
  value,
  onChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Surface style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: theme.colors.surface }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>{title}</Text>
      <Text style={{ fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary }}>{body}</Text>
      <Button
        onPress={() => onChange(!value)}
        title={value ? 'Enabled' : 'Disabled'}
        variant={value ? 'primary' : 'secondary'}
      />
    </Surface>
  );
}

function SummaryTile({
  label,
  value,
  body,
}: {
  label: string;
  value: string;
  body: string;
}) {
  return (
    <Surface style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: theme.colors.surface }}>
      <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: theme.colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.text, fontFamily: theme.typography.displayFontFamily }}>{value}</Text>
      <Text style={{ fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary }}>{body}</Text>
    </Surface>
  );
}

function getCategoryTitle(slug: string) {
  return categories.find((item) => item.slug === slug)?.title ?? slug.replace(/-/g, ' ');
}

const demoHostMessages = [
  { id: 'msg-1', author: 'viewer_18', body: 'We can hear you clearly now.' },
  { id: 'msg-2', author: 'viewer_07', body: 'Please keep the camera steady for a moment.' },
  { id: 'msg-3', author: 'viewer_26', body: 'This live is smooth. Waiting for the main topic.' },
  { id: 'msg-4', author: 'viewer_31', body: 'Can you answer the last question from chat?' },
];

export function CreatorDashboardScreen() {
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const roles = getSessionRoles(session);
  const query = useQuery({
    queryKey: ['mobile-creator-dashboard'],
    queryFn: mobileApi.getCreatorDashboard,
  });
  const studioQuery = useQuery({
    queryKey: ['mobile-creator-studio-feed'],
    queryFn: mobileApi.getHomeFeed,
  });
  const liveCount = studioQuery.data?.trendingLives.length ?? 0;
  const contentCount = studioQuery.data?.premiumContent.length ?? 0;

  return (
    <Screen>
      <Heading title="Studio overview" />
      <Surface>
        <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
          Quick actions
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button onPress={() => router.push('/(creator)/create-live')} title="Create live" />
          <Button onPress={() => router.push('/(creator)/(tabs)/library')} title="Open library" variant="secondary" />
          <Button onPress={() => router.push('/(creator)/(tabs)/assistant')} title="Ask AI concierge" variant="ghost" />
        </View>
        {roles.includes('viewer') ? (
          <Button
            onPress={() => {
              setActiveRole('viewer');
              router.replace('/(viewer)/(tabs)/home');
            }}
            title="Switch to viewer mode"
            variant="ghost"
          />
        ) : null}
      </Surface>
      {query.isLoading ? <LoadingState label="Loading content creator dashboard..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Content creator dashboard unavailable" /> : null}
      {query.data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SummaryTile body="Monetized followers connected to your studio." label="Followers" value={String(query.data.followers)} />
            <SummaryTile body="Scheduled or live sessions currently in your surface." label="Live inventory" value={String(liveCount)} />
            <SummaryTile body="Premium content and classes visible in your library." label="Library items" value={String(contentCount + (studioQuery.data?.recommendedClasses.length ?? 0))} />
            <SummaryTile body="Verification is visible before buyers commit." label="Verification" value={query.data.verificationStatus} />
          </View>
          <WalletCards wallet={query.data.wallet} />
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Studio posture</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Your content creator workspace keeps lives, library items, earnings, and payout actions on one surface so
              pricing and access remain legible.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button onPress={() => router.push('/(creator)/create-live')} title="Open live builder" />
              <Button onPress={() => router.push('/(creator)/payouts')} title="Request payout" variant="secondary" />
            </View>
          </Surface>
          {query.data.recentTransactions.items.map((item) => (
            <TransactionRow item={item} key={item.id} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

export function CreatorLivesScreen() {
  const query = useQuery({
    queryKey: ['mobile-creator-lives'],
    queryFn: mobileApi.getHomeFeed,
  });

  return (
    <Screen>
      <Heading title="Live sessions" />
      <Surface>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
          Use the live builder to set pricing, visibility, and timing before viewers receive access.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button onPress={() => router.push('/(creator)/create-live')} title="Create live session" />
          <Button onPress={() => router.push('/(creator)/(tabs)/assistant')} title="Plan with AI" variant="secondary" />
        </View>
      </Surface>
      {query.isLoading ? <LoadingState label="Loading live inventory..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Lives unavailable" /> : null}
      {query.data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SummaryTile
              body="Sessions visible in the current content creator view."
              label="Inventory"
              value={String(query.data.trendingLives.length)}
            />
            <SummaryTile
              body="Already running or actively drawing viewers."
              label="Live now"
              value={String(query.data.trendingLives.filter((item) => item.isLive).length)}
            />
            <SummaryTile
              body="Sessions with payment gating or active monetization."
              label="Paid access"
              value={String(query.data.trendingLives.filter((item) => item.price > 0).length)}
            />
          </View>
          {query.data.trendingLives.length ? (
            query.data.trendingLives.map((item) => <LiveCard key={item.id} live={item} />)
          ) : (
            <EmptyState body="Created lives will surface here once inventory exists." title="No live sessions yet" />
          )}
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Content creator guardrails</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Paid sessions must resolve payment before room access. Private sessions should use invite-driven access
              and clear host notes so moderators and viewers know what to expect.
            </Text>
          </Surface>
        </>
      ) : null}
    </Screen>
  );
}

export function CreatorLibraryScreen() {
  const query = useQuery({
    queryKey: ['mobile-creator-library'],
    queryFn: mobileApi.getHomeFeed,
  });

  return (
    <Screen>
      <Heading title="Content creator library" />
      {query.isLoading ? <LoadingState label="Loading library..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Library unavailable" /> : null}
      {query.data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SummaryTile
              body="Download packs, replays, and premium lessons in your inventory."
              label="Premium content"
              value={String(query.data.premiumContent.length)}
            />
            <SummaryTile
              body="Structured learning programs currently visible to buyers."
              label="Classes"
              value={String(query.data.recommendedClasses.length)}
            />
            <SummaryTile
              body="All monetized items across your content creator surface."
              label="Total items"
              value={String(query.data.premiumContent.length + query.data.recommendedClasses.length)}
            />
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Publishing flow</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Keep previews clean, access states intentional, and pricing explicit so users understand what unlocks
              after payment.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button onPress={() => router.push('/(creator)/create-live')} title="Create companion live" />
              <Button onPress={() => router.push('/(creator)/settings')} title="Review content creator settings" variant="secondary" />
            </View>
          </Surface>
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#171512' }}>Premium content</Text>
            {query.data.premiumContent.length ? (
              query.data.premiumContent.map((item) => <ContentCard content={item} key={item.id} />)
            ) : (
              <EmptyState body="Premium content will appear here after you publish it." title="No premium content yet" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#171512' }}>Classes and workshops</Text>
            {query.data.recommendedClasses.length ? (
              query.data.recommendedClasses.map((item) => <ClassCard classItem={item} key={item.id} />)
            ) : (
              <EmptyState body="Classes and workshops will appear here after you schedule them." title="No classes yet" />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

export function CreatorWalletScreen() {
  const query = useQuery({
    queryKey: ['mobile-creator-wallet'],
    queryFn: mobileApi.getCreatorDashboard,
  });

  const lastPayout = query.data?.recentTransactions.items.find((item) => item.type === 'payout');

  return (
    <Screen>
      <Heading title="Earnings" />
      {query.isLoading ? <LoadingState label="Loading wallet..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Wallet unavailable" /> : null}
      {query.data ? (
        <>
          <WalletCards wallet={query.data.wallet} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SummaryTile
              body="Content creator share already settled into your balance."
              label="Available now"
              value={formatCurrency(query.data.wallet.availableBalance, query.data.wallet.currency)}
            />
            <SummaryTile
              body="Awaiting settlement before payout eligibility."
              label="Pending"
              value={formatCurrency(query.data.wallet.pendingBalance, query.data.wallet.currency)}
            />
            <SummaryTile
              body="Total content creator earnings tracked across successful purchases."
              label="Lifetime"
              value={formatCurrency(query.data.wallet.lifetimeEarnings, query.data.wallet.currency)}
            />
            <SummaryTile
              body="Most recent payout action visible in your ledger."
              label="Last payout"
              value={lastPayout ? formatCurrency(lastPayout.amount, lastPayout.currency) : 'No payout yet'}
            />
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>How money moves</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              LiveGate keeps 20% of successful transactions while 80% settles to content creator balances. Pending funds stay
              separate until they are eligible for payout.
            </Text>
            <Button onPress={() => router.push('/(creator)/payouts')} title="Request payout" />
          </Surface>
          {query.data.recentTransactions.items.map((item) => (
            <TransactionRow item={item} key={item.id} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

export function CreatorProfileScreen() {
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const signOut = useSessionStore((state) => state.signOut);
  const roles = getSessionRoles(session);

  return (
    <Screen>
      <Heading title="Content creator profile" />
      <Surface>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#10211D' }}>
          {session?.user.fullName ?? 'LiveGate content creator'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
          {session?.user.email ?? 'No email loaded'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {roles.map((role) => (
            <CategoryChip active={session?.user.role === role} key={role} title={formatRoleLabel(role)} />
          ))}
        </View>
        {roles.includes('viewer') ? (
          <Button
            onPress={() => {
              setActiveRole('viewer');
              router.replace('/(viewer)/(tabs)/home');
            }}
            title="Switch to viewer workspace"
          />
        ) : null}
        <Button onPress={() => router.push('/(creator)/settings')} title="Settings" variant="secondary" />
        <Button onPress={() => router.push('/(creator)/notifications')} title="Notifications" variant="ghost" />
        <Button
          onPress={() => {
            signOut();
            router.replace('/(public)/sign-in');
          }}
          title="Sign out"
          variant="ghost"
        />
      </Surface>
    </Screen>
  );
}

export function PayoutsScreen() {
  const form = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { amount: 0, method: '', note: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.requestPayout,
  });

  return (
    <Screen>
      <Heading title="Request payout" />
      <Surface>
        <Controller
          control={form.control}
          name="amount"
          render={({ field }) => (
            <TextField label="Amount" onChangeText={field.onChange} placeholder="250" value={String(field.value ?? '')} />
          )}
        />
        <Controller
          control={form.control}
          name="method"
          render={({ field }) => (
            <TextField label="Method" onChangeText={field.onChange} placeholder="Bank transfer" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="note"
          render={({ field }) => (
            <TextField label="Note" onChangeText={field.onChange} placeholder="Optional note" value={field.value ?? ''} />
          )}
        />
        {mutation.isSuccess ? <Text style={{ color: '#205C47' }}>{mutation.data.message}</Text> : null}
        {mutation.isError ? <Text style={{ color: '#A34734' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title="Submit payout request" />
      </Surface>
    </Screen>
  );
}

export function CreateLiveScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleLabel, setScheduleLabel] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.slug ?? 'education');
  const [price, setPrice] = useState('45');
  const [visibility, setVisibility] = useState<VisibilityMode>('public');
  const [accessMode, setAccessMode] = useState<AccessMode>('paid');
  const [hostNotes, setHostNotes] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [createdSession, setCreatedSession] = useState<{
    status: 'draft' | 'published';
    title: string;
    scheduleLabel: string;
    accessPolicy: string;
  } | null>(null);
  const [liveSetupVisible, setLiveSetupVisible] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [showAudienceMessages, setShowAudienceMessages] = useState(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const numericPrice = Number(price || 0);
  const normalizedPrice = accessMode === 'paid' ? numericPrice : 0;
  const platformCommission = normalizedPrice * 0.2;
  const creatorNet = normalizedPrice * 0.8;
  const accessPolicy =
    accessMode === 'paid'
      ? 'Users must pay before joining this session.'
      : visibility === 'private'
        ? 'Invite-only access is required before viewers can join.'
        : 'This session can be joined without payment once it is visible.';

  const saveSession = (status: 'draft' | 'published') => {
    if (title.trim().length < 5) {
      setFeedback({ tone: 'danger', text: 'Add a clear live title before saving.' });
      return;
    }

    if (description.trim().length < 16) {
      setFeedback({ tone: 'danger', text: 'Add a fuller description so viewers know what they are paying for.' });
      return;
    }

    if (scheduleLabel.trim().length < 6) {
      setFeedback({ tone: 'danger', text: 'Add a schedule or start-time label before continuing.' });
      return;
    }

    if (accessMode === 'paid' && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
      setFeedback({ tone: 'danger', text: 'Paid lives need a valid price greater than zero.' });
      return;
    }

    setFeedback({
      tone: 'success',
      text:
        status === 'published'
          ? 'Live session prepared and marked as published in preview mode.'
          : 'Live draft saved in preview mode.',
    });
    setCreatedSession({
      status,
      title: title.trim(),
      scheduleLabel: scheduleLabel.trim(),
      accessPolicy,
    });
    setIsLive(false);
    setLiveSetupVisible(status === 'published');
  };

  const handleGoLive = async () => {
    if (!cameraEnabled && !micEnabled) {
      setFeedback({ tone: 'danger', text: 'Turn on camera or microphone before going live.' });
      return;
    }

    if (cameraEnabled && !cameraPermission?.granted) {
      const response = await requestCameraPermission();
      if (!response.granted) {
        setFeedback({ tone: 'danger', text: 'Camera access is required while camera is turned on.' });
        return;
      }
    }

    if (micEnabled && !microphonePermission?.granted) {
      const response = await requestMicrophonePermission();
      if (!response.granted) {
        setFeedback({ tone: 'danger', text: 'Microphone access is required while audio is turned on.' });
        return;
      }
    }

    setIsLive(true);
    setFeedback({ tone: 'success', text: 'Live session started in creator preview mode.' });
  };

  const liveStatusTone = isLive ? '#D9534F' : '#205C47';
  const canShowCameraPreview = cameraEnabled && cameraPermission?.granted;
  const liveAudienceCount = 148;

  return (
    <Screen>
      <Heading title="New live session" />
      <Surface>
        <TextField label="Session title" onChangeText={setTitle} placeholder="New York open breakdown" value={title} />
        <TextField
          label="Description"
          onChangeText={setDescription}
          placeholder="What will viewers learn, receive, or experience?"
          value={description}
        />
        <TextField
          label="Schedule"
          onChangeText={setScheduleLabel}
          placeholder="March 29, 7:00 PM EAT"
          value={scheduleLabel}
        />
        <Text style={{ fontSize: 13, color: '#60726C' }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((item) => (
            <CategoryChip
              active={category === item.slug}
              key={item.slug}
              onPress={() => setCategory(item.slug)}
              title={item.title}
            />
          ))}
        </View>
        <Text style={{ fontSize: 13, color: '#60726C' }}>Access model</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {accessModes.map((item) => (
            <CategoryChip
              active={accessMode === item.value}
              key={item.value}
              onPress={() => setAccessMode(item.value)}
              title={item.title}
            />
          ))}
        </View>
        <Text style={{ fontSize: 13, lineHeight: 20, color: '#60726C' }}>
          {accessModes.find((item) => item.value === accessMode)?.body}
        </Text>
        <Text style={{ fontSize: 13, color: '#60726C' }}>Visibility</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {visibilityModes.map((item) => (
            <CategoryChip
              active={visibility === item.value}
              key={item.value}
              onPress={() => setVisibility(item.value)}
              title={item.title}
            />
          ))}
        </View>
        <Text style={{ fontSize: 13, lineHeight: 20, color: '#60726C' }}>
          {visibilityModes.find((item) => item.value === visibility)?.body}
        </Text>
        {accessMode === 'paid' ? (
          <TextField label="Viewer price" onChangeText={setPrice} placeholder="45" value={price} />
        ) : null}
        <TextField
          label="Host notes"
          onChangeText={setHostNotes}
          placeholder="Optional notes for moderators, co-hosts, or reminders."
          value={hostNotes}
        />
      </Surface>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <SummaryTile
          body={accessMode === 'paid' ? 'Price shown to viewers before checkout.' : 'This live can be joined without payment.'}
          label="Viewer price"
          value={formatCurrency(normalizedPrice)}
        />
        <SummaryTile
          body="Platform share retained after a successful paid checkout."
          label="Platform share"
          value={formatCurrency(platformCommission)}
        />
        <SummaryTile
          body="Content creator share after LiveGate commission."
          label="Content creator share"
          value={formatCurrency(creatorNet)}
        />
        <SummaryTile
          body="Where the live will appear when it is available."
          label="Visibility"
          value={visibilityModes.find((item) => item.value === visibility)?.title ?? 'Public'}
        />
      </View>

      <Surface>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Preview</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#10211D' }}>
          {title.trim() || 'Untitled live session'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
          {description.trim() || 'Add a session description to clarify what viewers unlock.'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
          Category: {getCategoryTitle(category)}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
          Schedule: {scheduleLabel.trim() || 'No schedule entered yet'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>{accessPolicy}</Text>
        {hostNotes.trim() ? (
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>Host note: {hostNotes.trim()}</Text>
        ) : null}
      </Surface>

      {feedback ? (
        <Surface>
          <Text style={{ fontSize: 14, color: feedback.tone === 'success' ? '#196B59' : '#A64B40' }}>
            {feedback.text}
          </Text>
        </Surface>
      ) : null}

      {createdSession ? (
        <Surface>
          <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
            {createdSession.status === 'published' ? 'Published preview' : 'Draft preview'}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#10211D' }}>{createdSession.title}</Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>{createdSession.scheduleLabel}</Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>{createdSession.accessPolicy}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Button onPress={() => router.replace('/(creator)/(tabs)/lives')} title="Return to live sessions" />
            <Button onPress={() => router.push('/(creator)/(tabs)/library')} title="Open library" variant="secondary" />
          </View>
        </Surface>
      ) : null}

      {liveSetupVisible && createdSession?.status === 'published' && !isLive ? (
        <Surface padding={0} style={{ overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 8 }}>
            <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
              Live setup
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#10211D' }}>
              {isLive ? 'You are live' : 'Go live now'}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
              Switch camera and audio on or off before you start the session.
            </Text>
          </View>

          <View
            style={{
              height: 420,
              margin: 20,
              marginTop: 16,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: '#081513',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            {canShowCameraPreview ? (
              <CameraView
                active={liveSetupVisible}
                facing={cameraFacing}
                mirror={cameraFacing === 'front'}
                mode="video"
                style={{ flex: 1 }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 24,
                  backgroundColor: '#10211D',
                }}
              >
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '700',
                    color: '#F8F1E7',
                    textAlign: 'center',
                    fontFamily: theme.typography.displayFontFamily,
                  }}
                >
                  {cameraEnabled ? 'Enable camera access to preview your live' : 'Camera is off'}
                </Text>
                <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 22, color: '#BBD2CC', textAlign: 'center' }}>
                  {cameraEnabled
                    ? 'Turn on camera access, or continue with audio only.'
                    : 'Your live can still start with audio only if microphone stays enabled.'}
                </Text>
              </View>
            )}

            <View
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: liveStatusTone,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {isLive ? 'LIVE' : 'Preview'}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: 'rgba(16,33,29,0.72)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {cameraEnabled ? 'Camera on' : 'Camera off'}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: 'rgba(16,33,29,0.72)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {micEnabled ? 'Mic on' : 'Mic off'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
            {cameraEnabled && !cameraPermission?.granted ? (
              <Button onPress={() => void requestCameraPermission()} title="Allow camera access" variant="secondary" />
            ) : null}
            {micEnabled && !microphonePermission?.granted ? (
              <Button onPress={() => void requestMicrophonePermission()} title="Allow microphone access" variant="secondary" />
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button
                onPress={() => setCameraEnabled((current) => !current)}
                title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                variant="secondary"
              />
              <Button
                onPress={() => setMicEnabled((current) => !current)}
                title={micEnabled ? 'Mute microphone' : 'Turn microphone on'}
                variant="secondary"
              />
              <Button
                onPress={() => setCameraFacing((current) => (current === 'front' ? 'back' : 'front'))}
                title={cameraFacing === 'front' ? 'Use back camera' : 'Use front camera'}
                variant="ghost"
              />
            </View>
            <Button
              disabled={isLive}
              onPress={() => void handleGoLive()}
              title={isLive ? 'Live now' : 'Go live now'}
            />
          </View>
        </Surface>
      ) : null}

      {isLive && createdSession?.status === 'published' ? (
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              overflow: 'hidden',
              borderRadius: theme.radius.xl,
              backgroundColor: '#081513',
              ...theme.shadow.lg,
            }}
          >
            <View style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: theme.radius.pill,
                    backgroundColor: '#D9534F',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>LIVE</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(11,21,19,0.62)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: theme.radius.pill,
                  }}
                >
                  <Ionicons color="#fffaf2" name="people-outline" size={16} />
                  <Text style={{ color: '#fffaf2', fontSize: 13, fontWeight: '600' }}>{liveAudienceCount}</Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAudienceMessages((current) => !current)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(11,21,19,0.62)',
                }}
              >
                <Ionicons color="#fffaf2" name={showAudienceMessages ? 'chatbubble' : 'chatbubble-outline'} size={20} />
              </TouchableOpacity>
            </View>

            <View style={{ width: '100%', aspectRatio: 9 / 16, backgroundColor: '#081513' }}>
              {canShowCameraPreview ? (
                <CameraView active facing={cameraFacing} mirror={cameraFacing === 'front'} mode="video" style={{ flex: 1 }} />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                    backgroundColor: '#10211D',
                  }}
                >
                  <Ionicons color="#fffaf2" name="videocam-off-outline" size={42} />
                  <Text
                    style={{
                      marginTop: 14,
                      fontSize: 22,
                      lineHeight: 30,
                      color: '#F8F1E7',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontFamily: theme.typography.displayFontFamily,
                    }}
                  >
                    Camera is off. You are live on audio.
                  </Text>
                </View>
              )}
            </View>

            {showAudienceMessages ? (
              <View
                style={{
                  position: 'absolute',
                  left: 16,
                  right: 88,
                  bottom: 118,
                  zIndex: 2,
                  gap: 8,
                }}
              >
                {demoHostMessages.slice(0, 3).map((message) => (
                  <View
                    key={message.id}
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '92%',
                      borderRadius: 18,
                      backgroundColor: 'rgba(11,21,19,0.62)',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: '#b8d8cf', fontSize: 12, fontWeight: '600', marginBottom: 2 }}>
                      {message.author}
                    </Text>
                    <Text style={{ color: '#fffaf2', fontSize: 13, lineHeight: 18 }}>{message.body}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View
              style={{
                position: 'absolute',
                left: 20,
                right: 20,
                bottom: 20,
                zIndex: 3,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMicEnabled((current) => !current)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: micEnabled ? 'rgba(11,21,19,0.68)' : '#D9534F',
                }}
              >
                <Ionicons color="#fffaf2" name={micEnabled ? 'mic-outline' : 'mic-off-outline'} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCameraEnabled((current) => !current)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: cameraEnabled ? 'rgba(11,21,19,0.68)' : '#D9534F',
                }}
              >
                <Ionicons color="#fffaf2" name={cameraEnabled ? 'videocam-outline' : 'videocam-off-outline'} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCameraFacing((current) => (current === 'front' ? 'back' : 'front'))}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(11,21,19,0.68)',
                }}
              >
                <Ionicons color="#fffaf2" name="camera-reverse-outline" size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsLive(false);
                  setLiveSetupVisible(true);
                  setFeedback({ tone: 'success', text: 'Live ended. You can update setup and go live again.' });
                }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#D9534F',
                }}
              >
                <Ionicons color="#fffaf2" name="stop-circle-outline" size={24} />
              </TouchableOpacity>
            </View>
          </View>

          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>Live audience messages</Text>
            {demoHostMessages.map((message) => (
              <View
                key={message.id}
                style={{
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.textMuted }}>
                  {message.author}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 21, color: theme.colors.text }}>
                  {message.body}
                </Text>
              </View>
            ))}
          </Surface>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Button onPress={() => saveSession('published')} title="Publish live session" />
        <Button onPress={() => saveSession('draft')} title="Save draft" variant="secondary" />
      </View>
    </Screen>
  );
}

export function CreatorNotificationsScreen() {
  const query = useQuery({
    queryKey: ['mobile-creator-notifications'],
    queryFn: mobileApi.getNotifications,
  });

  return (
    <Screen>
      <Heading title="Content creator updates" />
      {query.isLoading ? <LoadingState label="Loading notifications..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Notifications unavailable" /> : null}
      {query.data ? query.data.items.map((item) => <NotificationRow item={item} key={item.id} />) : null}
    </Screen>
  );
}

export function CreatorSettingsScreen() {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const query = useQuery({
    queryKey: ['mobile-profile-settings', session?.user.id, 'creator'],
    queryFn: mobileApi.getProfileSettings,
    enabled: Boolean(session),
  });
  const saveMutation = useMutation({
    mutationFn: mobileApi.saveProfileSettings,
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
  const [settings, setSettings] = useState<ProfileSettingsPayload | null>(null);

  useEffect(() => {
    if (query.data) {
      setSettings(query.data);
    }
  }, [query.data]);

  return (
    <Screen>
      <Heading title="Content creator settings" />
      {query.isLoading ? <LoadingState label="Loading content creator settings..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Settings unavailable" /> : null}
      {settings ? (
        <>
          <Surface>
            <TextField
              label="Full name"
              onChangeText={(value) => setSettings((current) => (current ? { ...current, fullName: value } : current))}
              value={settings.fullName}
            />
            <TextField
              label="Email"
              onChangeText={(value) => setSettings((current) => (current ? { ...current, email: value } : current))}
              value={settings.email}
            />
            <TextField
              label="Preferred payout method"
              onChangeText={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        payoutPreferences: {
                          method: value,
                          note: current.payoutPreferences?.note,
                        },
                      }
                    : current,
                )
              }
              value={settings.payoutPreferences?.method ?? ''}
            />
            <TextField
              label="Payout note"
              onChangeText={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        payoutPreferences: {
                          method: current.payoutPreferences?.method ?? '',
                          note: value,
                        },
                      }
                    : current,
                )
              }
              value={settings.payoutPreferences?.note ?? ''}
            />
            <Text style={{ fontSize: 13, color: '#60726C' }}>Default role</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {settings.roles.map((role) => (
                <CategoryChip
                  active={settings.defaultRole === role}
                  key={role}
                  onPress={() => setSettings((current) => (current ? { ...current, defaultRole: role } : current))}
                  title={formatRoleLabel(role)}
                />
              ))}
            </View>
            <Text style={{ fontSize: 13, color: '#60726C' }}>Appearance</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {appearanceModes.map((mode) => (
                <CategoryChip
                  active={settings.appearancePreferences.theme === mode}
                  key={mode}
                  onPress={() =>
                    setSettings((current) =>
                      current
                        ? {
                            ...current,
                            appearancePreferences: {
                              ...current.appearancePreferences,
                              theme: mode,
                            },
                          }
                        : current,
                    )
                  }
                  title={mode}
                />
              ))}
            </View>
          </Surface>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SettingsToggle
              body="Receive reminders before paid lives you are hosting begin."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        notificationPreferences: { ...current.notificationPreferences, liveReminders: value },
                      }
                    : current,
                )
              }
              title="Live reminders"
              value={settings.notificationPreferences.liveReminders}
            />
            <SettingsToggle
              body="Keep payout, purchase, and earnings updates visible."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        notificationPreferences: { ...current.notificationPreferences, purchaseUpdates: value },
                      }
                    : current,
                )
              }
              title="Purchase updates"
              value={settings.notificationPreferences.purchaseUpdates}
            />
            <SettingsToggle
              body="Allow class launches and content creator announcements to stay enabled."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        notificationPreferences: { ...current.notificationPreferences, creatorAnnouncements: value },
                      }
                    : current,
                )
              }
              title="Content creator announcements"
              value={settings.notificationPreferences.creatorAnnouncements}
            />
            <SettingsToggle
              body="Keep security and system notices turned on."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        notificationPreferences: { ...current.notificationPreferences, systemAlerts: value },
                      }
                    : current,
                )
              }
              title="System alerts"
              value={settings.notificationPreferences.systemAlerts}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SettingsToggle
              body="Use tighter spacing in dashboard-heavy surfaces."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        appearancePreferences: { ...current.appearancePreferences, compactMode: value },
                      }
                    : current,
                )
              }
              title="Compact mode"
              value={settings.appearancePreferences.compactMode}
            />
            <SettingsToggle
              body="Keep your content creator profile visible to the wider learning community."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        privacyPreferences: { ...current.privacyPreferences, communityVisibility: value },
                      }
                    : current,
                )
              }
              title="Community visibility"
              value={settings.privacyPreferences.communityVisibility}
            />
            <SettingsToggle
              body="Keep your content creator profile visible in public discovery."
              onChange={(value) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        privacyPreferences: { ...current.privacyPreferences, publicCreatorProfile: value },
                      }
                    : current,
                )
              }
              title="Public content creator profile"
              value={settings.privacyPreferences.publicCreatorProfile}
            />
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Current profile posture</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Default role: {formatRoleLabel(settings.defaultRole)}. Theme: {settings.appearancePreferences.theme}. Public content creator
              profile: {settings.privacyPreferences.publicCreatorProfile ? 'enabled' : 'disabled'}.
            </Text>
          </Surface>
          {saveMutation.isSuccess ? (
            <Surface>
              <Text style={{ fontSize: 14, color: '#196B59' }}>{saveMutation.data.message}</Text>
            </Surface>
          ) : null}
          {saveMutation.isError ? (
            <Surface>
              <Text style={{ fontSize: 14, color: '#A64B40' }}>{(saveMutation.error as Error).message}</Text>
            </Surface>
          ) : null}
          <Button
            onPress={() => settings && saveMutation.mutate(settings)}
            title={saveMutation.isPending ? 'Saving settings...' : 'Save settings'}
          />
        </>
      ) : null}
    </Screen>
  );
}
