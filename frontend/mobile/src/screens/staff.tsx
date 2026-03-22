import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { mobileApi } from '@/api/client';
import { Button, EmptyState, Heading, LoadingState, Screen, Surface } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

const statLabel = {
  fontSize: 12,
  letterSpacing: 1.1,
  textTransform: 'uppercase' as const,
  color: '#60726C',
};

const statValue = {
  fontSize: 20,
  fontWeight: '700' as const,
  color: '#10211D',
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#10211D' }}>
              Risk and moderation
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
              Flagged content: {query.data.flaggedContent} | Suspicious payments: {query.data.suspiciousPayments} | Content creator approvals pending: {query.data.creatorApprovals}
            </Text>
          </Surface>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#10211D' }}>
              Revenue summary
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
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
