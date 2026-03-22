import type {
  ClassSummary,
  CreatorSummary,
  LiveSessionSummary,
  NotificationRecord,
  PremiumContentSummary,
  TransactionRecord,
  WalletSummary,
} from '@livegate/shared';
import { formatCurrency } from '@livegate/shared';
import { Pressable, Text, View } from 'react-native';
import { Surface } from '@/components/ui';
import { theme } from '@/theme';

const badgeBase = {
  borderRadius: theme.radius.pill,
  paddingHorizontal: 10,
  paddingVertical: 6,
  alignSelf: 'flex-start' as const,
};

export function CategoryChip({
  title,
  active = false,
  onPress,
}: {
  title: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ borderRadius: theme.radius.pill, opacity: pressed ? 0.92 : 1 }]}>
      <View
        style={{
          borderRadius: theme.radius.pill,
          borderWidth: 1,
          borderColor: active ? theme.colors.text : theme.colors.border,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: active ? theme.colors.text : theme.colors.surface,
        }}
      >
        <Text style={{ color: active ? theme.colors.background : theme.colors.textMuted, fontSize: 13, fontWeight: '600' }}>{title}</Text>
      </View>
    </Pressable>
  );
}

export function CreatorCard({
  creator,
  onPress,
}: {
  creator: CreatorSummary;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <Surface>
        <View style={{ ...badgeBase, backgroundColor: theme.colors.accentMuted }}>
          <Text style={{ color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}>CONTENT CREATOR</Text>
        </View>
        <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>{creator.displayName}</Text>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary, marginTop: -4 }}>@{creator.handle}</Text>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>{creator.headline}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{creator.followerCount} followers</Text>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{creator.verificationStatus}</Text>
        </View>
      </Surface>
    </Pressable>
  );
}

export function LiveCard({
  live,
  onPress,
}: {
  live: LiveSessionSummary;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <Surface>
        <View style={{ ...badgeBase, backgroundColor: live.isLive ? 'rgba(32,92,71,0.12)' : theme.colors.accentMuted }}>
          <Text style={{ color: live.isLive ? theme.colors.success : theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}>
            {live.isLive ? 'LIVE NOW' : 'UPCOMING'}
          </Text>
        </View>
        <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>{live.title}</Text>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>{live.description}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{live.creator.displayName}</Text>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{formatCurrency(live.price)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{live.viewerCount} viewers</Text>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{live.category.replace(/-/g, ' ')}</Text>
        </View>
      </Surface>
    </Pressable>
  );
}

export function ContentCard({
  content,
  onPress,
}: {
  content: PremiumContentSummary;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <Surface>
        <View style={{ ...badgeBase, backgroundColor: theme.colors.accentMuted }}>
          <Text style={{ color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}>PREMIUM</Text>
        </View>
        <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>{content.title}</Text>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>{content.description}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{content.creator.displayName}</Text>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{formatCurrency(content.price)}</Text>
        </View>
      </Surface>
    </Pressable>
  );
}

export function ClassCard({
  classItem,
  onPress,
}: {
  classItem: ClassSummary;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <Surface>
        <View style={{ ...badgeBase, backgroundColor: 'rgba(154,106,42,0.12)' }}>
          <Text style={{ color: theme.colors.warning, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}>CLASS</Text>
        </View>
        <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>{classItem.title}</Text>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>{classItem.description}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{classItem.scheduleLabel}</Text>
          <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{formatCurrency(classItem.price)}</Text>
        </View>
      </Surface>
    </Pressable>
  );
}

export function WalletCards({ wallet }: { wallet: WalletSummary }) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Surface>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>Available balance</Text>
        <Text style={{ fontSize: theme.typography.sizes['3xl'], fontWeight: theme.typography.weights.bold as any, color: theme.colors.text }}>{formatCurrency(wallet.availableBalance, wallet.currency)}</Text>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>Withdrawable now</Text>
      </Surface>
      <Surface>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>Pending balance</Text>
        <Text style={{ fontSize: theme.typography.sizes['3xl'], fontWeight: theme.typography.weights.bold as any, color: theme.colors.text }}>{formatCurrency(wallet.pendingBalance, wallet.currency)}</Text>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>Awaiting settlement</Text>
      </Surface>
      <Surface>
        <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>Lifetime earnings</Text>
        <Text style={{ fontSize: theme.typography.sizes['3xl'], fontWeight: theme.typography.weights.bold as any, color: theme.colors.text }}>{formatCurrency(wallet.lifetimeEarnings, wallet.currency)}</Text>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>Total content creator earnings recorded</Text>
      </Surface>
    </View>
  );
}

export function NotificationRow({ item }: { item: NotificationRecord }) {
  return (
    <Surface>
      <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>{item.title}</Text>
      <Text style={{ fontSize: theme.typography.sizes.base, color: theme.colors.textSecondary }}>{item.body}</Text>
      <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{item.read ? 'Read' : 'New update'}</Text>
    </Surface>
  );
}

export function TransactionRow({ item }: { item: TransactionRecord }) {
  return (
    <Surface>
      <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>{item.title}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{item.type}</Text>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{formatCurrency(item.amount, item.currency)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{item.counterparty ?? item.status}</Text>
        <Text style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </Surface>
  );
}
