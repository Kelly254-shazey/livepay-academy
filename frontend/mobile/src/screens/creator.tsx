import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import { NotificationRow, TransactionRow, WalletCards } from '@/components/cards';
import { Button, EmptyState, Heading, LoadingState, Screen, Surface, TextField } from '@/components/ui';

const payoutSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().min(2),
  note: z.string().optional(),
});

export function CreatorDashboardScreen() {
  const query = useQuery({
    queryKey: ['mobile-creator-dashboard'],
    queryFn: mobileApi.getCreatorDashboard,
  });

  return (
    <Screen>
      <Heading
        body="A compact creator view for earnings, payouts, follower momentum, and payout-ready operations."
        eyebrow="Creator dashboard"
        title="Studio overview"
      />
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
  return (
    <Screen>
      <Heading
        body="Keep creator identity, bio, category positioning, and profile controls close by."
        eyebrow="Profile"
        title="Creator profile"
      />
      <Surface>
        <Button onPress={() => router.push('/(creator)/settings')} title="Settings" variant="secondary" />
        <Button onPress={() => router.push('/(creator)/notifications')} title="Notifications" variant="ghost" />
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
  return (
    <Screen>
      <Heading
        body="Profile customization, payout preferences, notification controls, and account settings belong here."
        eyebrow="Settings"
        title="Creator settings"
      />
      <Surface>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
          Ready for real creator settings payloads once your backend endpoints are available.
        </Text>
      </Surface>
    </Screen>
  );
}
