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
import { Surface, styles as uiStyles } from '@/components/ui';
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
        <Text style={{ color: active ? theme.colors.background : theme.colors.mutedText, fontSize: 13, fontWeight: '600' }}>{title}</Text>
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
          <Text style={{ color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}>CREATOR</Text>
        </View>
        <Text style={uiStyles.emptyTitle}>{creator.displayName}</Text>
        <Text style={[uiStyles.body, { marginTop: -4 }]}>@{creator.handle}</Text>
        <Text style={uiStyles.body}>{creator.headline}</Text>
        <View style={uiStyles.metaRow}>
          <Text style={uiStyles.metaText}>{creator.followerCount} followers</Text>
          <Text style={uiStyles.metaText}>{creator.verificationStatus}</Text>
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
        <Text style={uiStyles.emptyTitle}>{live.title}</Text>
        <Text style={uiStyles.body}>{live.description}</Text>
        <View style={uiStyles.metaRow}>
          <Text style={uiStyles.metaText}>{live.creator.displayName}</Text>
          <Text style={uiStyles.metaText}>{formatCurrency(live.price)}</Text>
        </View>
        <View style={uiStyles.metaRow}>
          <Text style={uiStyles.metaText}>{live.viewerCount} viewers</Text>
          <Text style={uiStyles.metaText}>{live.category.replace(/-/g, ' ')}</Text>
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
        <Text style={uiStyles.emptyTitle}>{content.title}</Text>
        <Text style={uiStyles.body}>{content.description}</Text>
        <View style={uiStyles.metaRow}>
          <Text style={uiStyles.metaText}>{content.creator.displayName}</Text>
          <Text style={uiStyles.metaText}>{formatCurrency(content.price)}</Text>
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
        <Text style={uiStyles.emptyTitle}>{classItem.title}</Text>
        <Text style={uiStyles.body}>{classItem.description}</Text>
        <View style={uiStyles.metaRow}>
          <Text style={uiStyles.metaText}>{classItem.scheduleLabel}</Text>
          <Text style={uiStyles.metaText}>{formatCurrency(classItem.price)}</Text>
        </View>
      </Surface>
    </Pressable>
  );
}

export function WalletCards({ wallet }: { wallet: WalletSummary }) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Surface>
        <Text style={uiStyles.body}>Available balance</Text>
        <Text style={uiStyles.title}>{formatCurrency(wallet.availableBalance, wallet.currency)}</Text>
        <Text style={uiStyles.metaText}>Withdrawable now</Text>
      </Surface>
      <Surface>
        <Text style={uiStyles.body}>Pending balance</Text>
        <Text style={uiStyles.title}>{formatCurrency(wallet.pendingBalance, wallet.currency)}</Text>
        <Text style={uiStyles.metaText}>Awaiting settlement</Text>
      </Surface>
      <Surface>
        <Text style={uiStyles.body}>Lifetime earnings</Text>
        <Text style={uiStyles.title}>{formatCurrency(wallet.lifetimeEarnings, wallet.currency)}</Text>
        <Text style={uiStyles.metaText}>Total creator earnings recorded</Text>
      </Surface>
    </View>
  );
}

export function NotificationRow({ item }: { item: NotificationRecord }) {
  return (
    <Surface>
      <Text style={uiStyles.emptyTitle}>{item.title}</Text>
      <Text style={uiStyles.body}>{item.body}</Text>
      <Text style={uiStyles.metaText}>{item.read ? 'Read' : 'New update'}</Text>
    </Surface>
  );
}

export function TransactionRow({ item }: { item: TransactionRecord }) {
  return (
    <Surface>
      <Text style={uiStyles.emptyTitle}>{item.title}</Text>
      <View style={uiStyles.metaRow}>
        <Text style={uiStyles.metaText}>{item.type}</Text>
        <Text style={uiStyles.metaText}>{formatCurrency(item.amount, item.currency)}</Text>
      </View>
      <View style={uiStyles.metaRow}>
        <Text style={uiStyles.metaText}>{item.counterparty ?? item.status}</Text>
        <Text style={uiStyles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </Surface>
  );
}
