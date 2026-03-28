import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { mobileApi } from '@/api/client';
import { Button, EmptyState, Heading, LoadingState, Screen, Surface } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';

const statLabel = {
  fontSize: 12,
  letterSpacing: 1.1,
  textTransform: 'uppercase' as const,
  color: theme.colors.textMuted,
};

const statValue = {
  fontSize: 20,
  fontWeight: '700' as const,
  color: theme.colors.text,
};

export function StaffDashboardScreen() {
  const query = useQuery({
    queryKey: ['mobile-staff-dashboard'],
    queryFn: mobileApi.getAdminDashboard,
  });
  const signOut = useSessionStore((state) => state.signOut);

  return (
    <Screen>
      <Heading title="Platform control room" />
      {query.isLoading ? <LoadingState label="Loading staff dashboard..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Staff dashboard unavailable" /> : null}
      {query.data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Users', value: query.data.totalUsers },
              { label: 'Content Creators', value: query.data.totalCreators },
              { label: 'Active lives', value: query.data.activeLiveSessions },
              { label: 'Pending payouts', value: query.data.pendingPayouts },
            ].map((stat) => (
              <Surface key={stat.label} style={{ flexBasis: '47%', flexGrow: 1 }}>
                <Text style={statLabel}>{stat.label}</Text>
                <Text style={statValue}>{stat.value}</Text>
              </Surface>
            ))}
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>
              Risk and moderation
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary }}>
              Flagged content: {query.data.flaggedContent} | Suspicious payments: {query.data.suspiciousPayments} | Content creator approvals pending: {query.data.creatorApprovals}
            </Text>
          </Surface>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>
              Revenue summary
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary }}>
              Revenue: {query.data.totalRevenue} | Platform commission: {query.data.platformCommission}
            </Text>
          </Surface>
          <Button
            onPress={() => {
              signOut();
            }}
            title="Sign out"
            variant="secondary"
          />
        </>
      ) : null}
    </Screen>
  );
}
