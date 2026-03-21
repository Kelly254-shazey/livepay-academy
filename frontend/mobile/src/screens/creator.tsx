import type { ProfileSettingsPayload } from '@livegate/shared';
import { getSessionRoles } from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import { CategoryChip, NotificationRow, TransactionRow, WalletCards } from '@/components/cards';
import { Button, EmptyState, Heading, LoadingState, Screen, Surface, TextField } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

const payoutSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().min(2),
  note: z.string().optional(),
});

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
    <Surface style={{ flexBasis: '47%', flexGrow: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#10211D' }}>{title}</Text>
      <Text style={{ fontSize: 13, lineHeight: 20, color: '#60726C' }}>{body}</Text>
      <Button onPress={() => onChange(!value)} title={value ? 'Enabled' : 'Disabled'} variant={value ? 'primary' : 'secondary'} />
    </Surface>
  );
}

export function CreatorDashboardScreen() {
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const roles = getSessionRoles(session);
  const query = useQuery({
    queryKey: ['mobile-creator-dashboard'],
    queryFn: mobileApi.getCreatorDashboard,
  });

  return (
    <Screen>
      <Heading
        body="A calm operating layer for earnings, payouts, follower momentum, publishing, and creator-side navigation."
        eyebrow="Creator dashboard"
        title="Studio overview"
      />
      <Surface>
        <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
          Quick actions
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button onPress={() => router.push('/(creator)/create-live')} title="Create live" />
          <Button onPress={() => router.push('/(creator)/payouts')} title="Request payout" variant="secondary" />
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
      {query.isLoading ? <LoadingState label="Loading creator dashboard..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Creator dashboard unavailable" /> : null}
      {query.data ? (
        <>
          <WalletCards wallet={query.data.wallet} />
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Verification</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{query.data.verificationStatus}</Text>
          </Surface>
          {query.data.recentTransactions.items.map((item) => (
            <TransactionRow item={item} key={item.id} />
          ))}
          <Button onPress={() => router.push('/(creator)/payouts')} title="Request payout" />
        </>
      ) : null}
    </Screen>
  );
}

export function CreatorLivesScreen() {
  return (
    <Screen>
      <Heading
        body="Create, review, and manage paid live sessions with a smaller-screen creator workflow."
        eyebrow="Lives"
        title="Live sessions"
      />
      <Surface>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
          Live creation, scheduling, pricing, and moderation controls can expand here on top of the existing API contracts.
        </Text>
        <Button onPress={() => router.push('/(creator)/create-live')} title="Create live session" />
      </Surface>
    </Screen>
  );
}

export function CreatorLibraryScreen() {
  return (
    <Screen>
      <Heading
        body="Manage premium content and class inventory without cluttering the main dashboard."
        eyebrow="Library"
        title="Creator library"
      />
      <Surface>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
          Premium content management, class management, and publishing workflows can mount here when those endpoints are connected.
        </Text>
      </Surface>
    </Screen>
  );
}

export function CreatorWalletScreen() {
  const query = useQuery({
    queryKey: ['mobile-creator-wallet'],
    queryFn: mobileApi.getCreatorDashboard,
  });

  return (
    <Screen>
      <Heading body="Available balance, pending balance, and creator earnings." eyebrow="Wallet" title="Earnings" />
      {query.isLoading ? <LoadingState label="Loading wallet..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Wallet unavailable" /> : null}
      {query.data ? <WalletCards wallet={query.data.wallet} /> : null}
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
      <Heading
        body="Creator identity, hybrid role switching, notifications, and account actions stay close without crowding the studio."
        eyebrow="Profile"
        title="Creator profile"
      />
      <Surface>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#10211D' }}>
          {session?.user.fullName ?? 'LiveGate creator'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
          {session?.user.email ?? 'No email loaded'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {roles.map((role) => (
            <CategoryChip active={session?.user.role === role} key={role} title={role} />
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
      <Heading
        body="Request creator payouts from a compact, production-style form."
        eyebrow="Payouts"
        title="Request payout"
      />
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
  return (
    <Screen>
      <Heading
        body="Use this flow for live titles, pricing, schedules, and host-facing setup once your live creation endpoint is connected."
        eyebrow="Create live"
        title="New live session"
      />
      <Surface>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
          This route is reserved for the creator live-builder workflow and intentionally left free of fake session records.
        </Text>
      </Surface>
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
      <Heading body="Announcements, payouts, reviews, and creator system updates." eyebrow="Notifications" title="Creator updates" />
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
      <Heading
        body="Profile customization, payout preferences, notification controls, and account settings belong here."
        eyebrow="Settings"
        title="Creator settings"
      />
      {query.isLoading ? <LoadingState label="Loading creator settings..." /> : null}
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
                  onPress={() =>
                    setSettings((current) => (current ? { ...current, defaultRole: role } : current))
                  }
                  title={role}
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
              body="Allow class launches and creator announcements to stay enabled."
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
              title="Creator announcements"
              value={settings.notificationPreferences.creatorAnnouncements}
            />
            <SettingsToggle
              body="Keep your creator profile visible in public discovery."
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
              title="Public creator profile"
              value={settings.privacyPreferences.publicCreatorProfile}
            />
          </View>
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
