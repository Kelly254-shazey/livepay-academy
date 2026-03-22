import type { ProfileSettingsPayload } from '@livegate/shared';
import { categories, formatCurrency, getSessionRoles } from '@livegate/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { mobileApi } from '@/api/client';
import {
  CategoryChip,
  ClassCard,
  ContentCard,
  CreatorCard,
  LiveCard,
  NotificationRow,
  TransactionRow,
} from '@/components/cards';
import { 
  Button, 
  EmptyState, 
  Heading, 
  LoadingState, 
  Screen, 
  Surface, 
  TextField,
  Badge,
  Avatar
} from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';

const sectionTitleStyle = { 
  fontSize: theme.typography.sizes.xl, 
  fontWeight: theme.typography.weights.bold as any, 
  color: theme.colors.text,
  marginBottom: theme.spacing.md
};

const metaLabelStyle = { 
  fontSize: theme.typography.sizes.xs, 
  fontWeight: theme.typography.weights.medium as any,
  color: theme.colors.textMuted,
  textTransform: 'uppercase' as const,
  letterSpacing: 1
};

const metaValueStyle = { 
  fontSize: theme.typography.sizes.lg, 
  fontWeight: theme.typography.weights.semibold as any, 
  color: theme.colors.text 
};

const searchFilters = [
  { title: 'All', value: 'all' },
  { title: 'Creators', value: 'creator' },
  { title: 'Lives', value: 'live' },
  { title: 'Content', value: 'content' },
  { title: 'Classes', value: 'class' },
] as const;

const appearanceModes = ['system', 'light', 'dark'] as const;

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
    <Surface style={{ flex: 1, minWidth: '45%' }}>
      <Text style={{ fontSize: theme.typography.sizes.base, fontWeight: theme.typography.weights.semibold as any, color: theme.colors.text }}>
        {title}
      </Text>
      <Text style={{ fontSize: theme.typography.sizes.sm, lineHeight: 20, color: theme.colors.textSecondary, marginVertical: theme.spacing.xs }}>
        {body}
      </Text>
      <Button 
        onPress={() => onChange(!value)} 
        title={value ? 'Enabled' : 'Disabled'} 
        variant={value ? 'primary' : 'secondary'} 
      />
    </Surface>
  );
}

function getCategoryTitle(slug: string) {
  return categories.find((item) => item.slug === slug)?.title ?? slug.replace(/-/g, ' ');
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
    <Surface style={{ flex: 1, minWidth: '45%' }}>
      <Text style={metaLabelStyle}>{label}</Text>
      <Text style={{ fontSize: theme.typography.sizes['2xl'], fontWeight: theme.typography.weights.bold as any, color: theme.colors.text, marginVertical: theme.spacing.xs }}>
        {value}
      </Text>
      <Text style={{ fontSize: theme.typography.sizes.sm, lineHeight: 20, color: theme.colors.textSecondary }}>
        {body}
      </Text>
    </Surface>
  );
}

export function HomeScreen() {
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const query = useQuery({
    queryKey: ['mobile-home'],
    queryFn: mobileApi.getHomeFeed,
  });
  const homeCategories = query.data?.categories?.length ? query.data.categories.slice(0, 6) : categories.slice(0, 6);
  const sessionRoles = getSessionRoles(session);
  const featuredCreators = query.data?.featuredCreators.length ?? 0;
  const featuredLives = query.data?.trendingLives.length ?? 0;
  const featuredClasses = query.data?.recommendedClasses.length ?? 0;

  return (
    <Screen>
      <Heading
        eyebrow="LiveGate Home"
        title="Discover Premium Learning"
        body="Explore live sessions, premium content, and expert-led classes from top creators."
      />
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        <SummaryTile
          label="Creators"
          value={featuredCreators.toString()}
          body="Featured experts"
        />
        <SummaryTile
          label="Live Sessions"
          value={featuredLives.toString()}
          body="Active & upcoming"
        />
        <SummaryTile
          label="Classes"
          value={featuredClasses.toString()}
          body="Structured courses"
        />
      </View>

      <Surface>
        <Text style={{ fontSize: theme.typography.sizes.base, fontWeight: theme.typography.weights.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <Button onPress={() => router.push('/(viewer)/(tabs)/assistant')} title="Ask AI Assistant" />
          <Button onPress={() => router.push('/(viewer)/(tabs)/library')} title="My Library" variant="secondary" />
          {sessionRoles.includes('creator') && (
            <Button
              onPress={() => {
                setActiveRole('creator');
                router.replace('/(creator)/(tabs)/dashboard');
              }}
              title="Creator Mode"
              variant="ghost"
            />
          )}
        </View>
      </Surface>

      {session?.isDemo && (
        <Surface>
          <Badge variant="warning">Demo Mode</Badge>
          <Text style={{ fontSize: theme.typography.sizes.base, fontWeight: theme.typography.weights.semibold, color: theme.colors.text, marginTop: theme.spacing.xs }}>
            Preview Experience
          </Text>
          <Text style={{ fontSize: theme.typography.sizes.sm, lineHeight: 22, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
            You're exploring LiveGate with demo data. All features are available for testing.
          </Text>
        </Surface>
      )}

      <Heading
        eyebrow="Browse"
        title="Categories"
        body="Find content by topic and expertise area."
      />
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {homeCategories.map((category) => (
          <CategoryChip
            key={category.slug}
            onPress={() => router.push(`/(viewer)/category/${category.slug}`)}
            title={category.title}
          />
        ))}
      </View>

      {query.isLoading && <LoadingState label="Loading content..." />}
      {query.isError && <EmptyState title="Content Unavailable" body={(query.error as Error).message} />}
      
      {query.data && (
        <>
          <View style={{ gap: theme.spacing.md }}>
            <Text style={sectionTitleStyle}>Trending Lives</Text>
            {query.data.trendingLives.length ? (
              query.data.trendingLives.map((item) => (
                <LiveCard key={item.id} live={item} onPress={() => router.push(`/(viewer)/live/${item.id}`)} />
              ))
            ) : (
              <EmptyState title="No Live Sessions" body="Check back soon for new live content." />
            )}
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Text style={sectionTitleStyle}>Featured Creators</Text>
            {query.data.featuredCreators.length ? (
              query.data.featuredCreators.map((item) => (
                <CreatorCard key={item.id} creator={item} onPress={() => router.push(`/(viewer)/creator/${item.id}`)} />
              ))
            ) : (
              <EmptyState title="No Creators" body="Featured creators will appear here." />
            )}
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Text style={sectionTitleStyle}>Premium Content</Text>
            {query.data.premiumContent.length ? (
              query.data.premiumContent.map((item) => (
                <ContentCard content={item} key={item.id} onPress={() => router.push(`/(viewer)/content/${item.id}`)} />
              ))
            ) : (
              <EmptyState title="No Premium Content" body="Exclusive content will be featured here." />
            )}
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Text style={sectionTitleStyle}>Recommended Classes</Text>
            {query.data.recommendedClasses.length ? (
              query.data.recommendedClasses.map((item) => (
                <ClassCard classItem={item} key={item.id} onPress={() => router.push(`/(viewer)/class/${item.id}`)} />
              ))
            ) : (
              <EmptyState title="No Classes" body="Structured courses will appear here." />
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

export function CategoriesScreen() {
  return (
    <Screen>
      <Heading
        body="Each category has a dedicated browsing context for creators, lives, locked content, and classes."
        eyebrow="Categories"
        title="Browse with intent"
      />
      {categories.map((category) => (
        <Surface key={category.slug}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#171512' }}>{category.title}</Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{category.shortDescription}</Text>
          <Button onPress={() => router.push(`/(viewer)/category/${category.slug}`)} title="Open category" />
        </Surface>
      ))}
    </Screen>
  );
}

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof searchFilters)[number]['value']>('all');
  const searchQuery = useQuery({
    queryKey: ['mobile-search', query, type],
    queryFn: () => mobileApi.search({ query, type }),
    enabled: query.trim().length > 1,
  });

  return (
    <Screen>
      <Heading body="Search creators, lives, premium content, and classes." eyebrow="Search" title="Find what matters" />
      <TextField label="Search" onChangeText={setQuery} placeholder="Search LiveGate" value={query} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {searchFilters.map((filter) => (
          <CategoryChip active={type === filter.value} key={filter.value} onPress={() => setType(filter.value)} title={filter.title} />
        ))}
      </View>
      {query.trim().length <= 1 ? <EmptyState body="Start typing to search across the platform." title="Search is idle" /> : null}
      {searchQuery.isLoading ? <LoadingState label="Searching..." /> : null}
      {searchQuery.isError ? <EmptyState body={(searchQuery.error as Error).message} title="Search unavailable" /> : null}
      {searchQuery.data ? (
        <View style={{ gap: 12 }}>
          {searchQuery.data.creators.map((item) => (
            <CreatorCard key={item.id} creator={item} onPress={() => router.push(`/(viewer)/creator/${item.id}`)} />
          ))}
          {searchQuery.data.lives.map((item) => (
            <LiveCard key={item.id} live={item} onPress={() => router.push(`/(viewer)/live/${item.id}`)} />
          ))}
          {searchQuery.data.content.map((item) => (
            <ContentCard content={item} key={item.id} onPress={() => router.push(`/(viewer)/content/${item.id}`)} />
          ))}
          {searchQuery.data.classes.map((item) => (
            <ClassCard classItem={item} key={item.id} onPress={() => router.push(`/(viewer)/class/${item.id}`)} />
          ))}
          {!searchQuery.data.creators.length &&
          !searchQuery.data.lives.length &&
          !searchQuery.data.content.length &&
          !searchQuery.data.classes.length ? (
            <EmptyState body="Try a different keyword or switch the active filter." title="No results" />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

export function ViewerLibraryScreen() {
  const query = useQuery({
    queryKey: ['viewer-dashboard-mobile'],
    queryFn: mobileApi.getViewerDashboard,
  });

  const libraryItemCount =
    (query.data?.purchasedLives.items.length ?? 0) +
    (query.data?.purchasedContent.items.length ?? 0) +
    (query.data?.enrolledClasses.items.length ?? 0);

  return (
    <Screen>
      <Heading
        body="Purchases, joined lives, saved content, followed creators, notifications, and transaction history converge here."
        eyebrow="Viewer dashboard"
        title="Your library"
      />
      {query.isLoading ? <LoadingState label="Loading dashboard..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Viewer dashboard unavailable" /> : null}
      {query.data ? (
        <>
          <Surface>
            <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
              Library actions
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button onPress={() => router.push('/(viewer)/(tabs)/search')} title="Find something new" />
              <Button onPress={() => router.push('/(viewer)/(tabs)/assistant')} title="Ask AI concierge" variant="secondary" />
            </View>
          </Surface>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SummaryTile
              body="Lives, content, and classes already in your library."
              label="Owned items"
              value={String(libraryItemCount)}
            />
            <SummaryTile
              body="Creators you can return to without searching again."
              label="Following"
              value={String(query.data.followedCreators.items.length)}
            />
            <SummaryTile
              body="Completed or ready purchase records tied to access."
              label="Transactions"
              value={String(query.data.transactions.items.length)}
            />
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Continue where you left off</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Your library is organized around what you have already paid for, so live joins, content unlocks, and
              enrolled classes stay one tap away.
            </Text>
          </Surface>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Purchased lives</Text>
            {query.data.purchasedLives.items.length ? (
              query.data.purchasedLives.items.map((item) => (
                <LiveCard key={item.id} live={item} onPress={() => router.push(`/(viewer)/live/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Paid live sessions will appear here after checkout." title="No purchased lives" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Saved premium content</Text>
            {query.data.purchasedContent.items.length ? (
              query.data.purchasedContent.items.map((item) => (
                <ContentCard content={item} key={item.id} onPress={() => router.push(`/(viewer)/content/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Unlocked premium content will appear here." title="No saved content" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Enrolled classes</Text>
            {query.data.enrolledClasses.items.length ? (
              query.data.enrolledClasses.items.map((item) => (
                <ClassCard classItem={item} key={item.id} onPress={() => router.push(`/(viewer)/class/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Classes you enroll in will stay visible here." title="No enrolled classes" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Followed creators</Text>
            {query.data.followedCreators.items.length ? (
              query.data.followedCreators.items.map((item) => (
                <CreatorCard creator={item} key={item.id} onPress={() => router.push(`/(viewer)/creator/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Creators you follow will appear here for quick access." title="No followed creators" />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

export function ViewerProfileScreen() {
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const signOut = useSessionStore((state) => state.signOut);
  const roles = getSessionRoles(session);

  return (
    <Screen>
      <Heading
        body="Profile, navigation shortcuts, hybrid role switching, and account actions stay available without turning the app into a maze."
        eyebrow="Profile"
        title="Account"
      />
      <Surface>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#10211D' }}>
          {session?.user.fullName ?? 'LiveGate viewer'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
          {session?.user.email ?? 'No email loaded'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {roles.map((role) => (
            <CategoryChip active={session?.user.role === role} key={role} title={role} />
          ))}
        </View>
        {roles.includes('creator') ? (
          <Button
            onPress={() => {
              setActiveRole('creator');
              router.replace('/(creator)/(tabs)/dashboard');
            }}
            title="Switch to creator workspace"
            variant="secondary"
          />
        ) : null}
        <Button onPress={() => router.push('/(viewer)/notifications')} title="Notifications" />
        <Button onPress={() => router.push('/(viewer)/wallet')} title="Wallet" variant="secondary" />
        <Button onPress={() => router.push('/(viewer)/settings')} title="Settings" variant="ghost" />
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

export function CategoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ['mobile-category', slug],
    queryFn: () => mobileApi.getCategoryDetail(slug),
    enabled: Boolean(slug),
  });

  return (
    <Screen>
      <Heading body="Creators, lives, premium content, and classes are grouped within this category." eyebrow="Category" title={slug?.replace(/-/g, ' ') ?? 'Category'} />
      {query.isLoading ? <LoadingState label="Loading category..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Category unavailable" /> : null}
      {query.data ? (
        <>
          {query.data.creators.items.map((item) => (
            <CreatorCard creator={item} key={item.id} onPress={() => router.push(`/(viewer)/creator/${item.id}`)} />
          ))}
          {query.data.lives.items.map((item) => (
            <LiveCard key={item.id} live={item} onPress={() => router.push(`/(viewer)/live/${item.id}`)} />
          ))}
          {query.data.premiumContent.items.map((item) => (
            <ContentCard content={item} key={item.id} onPress={() => router.push(`/(viewer)/content/${item.id}`)} />
          ))}
          {query.data.classes.items.map((item) => (
            <ClassCard classItem={item} key={item.id} onPress={() => router.push(`/(viewer)/class/${item.id}`)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

export function CreatorProfileScreen() {
  const { creatorId } = useLocalSearchParams<{ creatorId: string }>();
  const query = useQuery({
    queryKey: ['mobile-creator', creatorId],
    queryFn: () => mobileApi.getCreatorProfile(creatorId),
    enabled: Boolean(creatorId),
  });

  return (
    <Screen>
      {query.isLoading ? <LoadingState label="Loading creator..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Creator unavailable" /> : null}
      {query.data ? (
        <>
          <Heading body={query.data.creator.bio ?? query.data.creator.headline} eyebrow="Creator" title={query.data.creator.displayName} />
          <Surface>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 14, color: '#6E675C' }}>@{query.data.creator.handle}</Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{query.data.creator.headline}</Text>
              </View>
              <Button title="Follow creator" />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {query.data.creator.categories.map((category) => (
                <CategoryChip key={category} title={getCategoryTitle(category)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Followers</Text>
                <Text style={metaValueStyle}>{query.data.creator.followerCount}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Reviews</Text>
                <Text style={metaValueStyle}>{query.data.creator.reviewCount}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Status</Text>
                <Text style={metaValueStyle}>{query.data.creator.verificationStatus}</Text>
              </View>
            </View>
          </Surface>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Reviews</Text>
            {query.data.reviews.items.length ? (
              query.data.reviews.items.map((review) => (
                <Surface key={review.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>{review.authorName}</Text>
                    <Text style={{ fontSize: 13, color: '#6E675C' }}>{review.rating}/5</Text>
                  </View>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{review.comment}</Text>
                </Surface>
              ))
            ) : (
              <EmptyState body="Creator reviews will appear here when returned by the backend." title="No reviews yet" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Upcoming lives</Text>
            {query.data.upcomingLives.items.length ? (
              query.data.upcomingLives.items.map((item) => (
                <LiveCard key={item.id} live={item} onPress={() => router.push(`/(viewer)/live/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Upcoming sessions from this creator will appear here." title="No lives scheduled" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Premium content</Text>
            {query.data.premiumContent.items.length ? (
              query.data.premiumContent.items.map((item) => (
                <ContentCard content={item} key={item.id} onPress={() => router.push(`/(viewer)/content/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Locked content from this creator will appear here." title="No premium content" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Classes</Text>
            {query.data.classes.items.length ? (
              query.data.classes.items.map((item) => (
                <ClassCard classItem={item} key={item.id} onPress={() => router.push(`/(viewer)/class/${item.id}`)} />
              ))
            ) : (
              <EmptyState body="Classes and workshops from this creator will appear here." title="No classes yet" />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

export function LiveDetailsScreen() {
  const { liveId } = useLocalSearchParams<{ liveId: string }>();
  const query = useQuery({
    queryKey: ['mobile-live', liveId],
    queryFn: () => mobileApi.getLiveDetail(liveId),
    enabled: Boolean(liveId),
  });

  return (
    <Screen>
      {query.isLoading ? <LoadingState label="Loading live session..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Live unavailable" /> : null}
      {query.data ? (
        <>
          <Heading body={query.data.live.description} eyebrow="Paid live" title={query.data.live.title} />
          <Surface>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Host</Text>
                <Text style={metaValueStyle}>{query.data.live.creator.displayName}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Category</Text>
                <Text style={metaValueStyle}>{getCategoryTitle(query.data.live.category)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Starts</Text>
                <Text style={metaValueStyle}>{query.data.live.startTime}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Price</Text>
                <Text style={metaValueStyle}>{formatCurrency(query.data.live.price)}</Text>
              </View>
            </View>
          </Surface>
          <Surface>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              {query.data.live.accessGranted
                ? 'Access granted. You can join the live room immediately.'
                : 'Payment is required before this live can be joined. Connect your payment backend to unlock this flow.'}
            </Text>
            {query.data.live.accessGranted ? (
              <Button onPress={() => router.push(`/(viewer)/live/${liveId}/room`)} title="Join live room" />
            ) : (
              <Button
                onPress={() =>
                  router.push({
                    pathname: '/(viewer)/checkout',
                    params: { productId: liveId, productType: 'live' },
                  })
                }
                title="Continue to checkout"
                variant="secondary"
              />
            )}
          </Surface>
        </>
      ) : null}
    </Screen>
  );
}

export function LiveRoomScreen() {
  const { liveId } = useLocalSearchParams<{ liveId: string }>();
  const query = useQuery({
    queryKey: ['mobile-live-room', liveId],
    queryFn: () => mobileApi.getLiveRoom(liveId),
    enabled: Boolean(liveId),
  });

  return (
    <Screen>
      {query.isLoading ? <LoadingState label="Connecting to live room..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Live room unavailable" /> : null}
      {query.data ? (
        <>
          <Heading body={query.data.live.description} eyebrow="Live room" title={query.data.live.title} />
          <Surface>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Host</Text>
                <Text style={metaValueStyle}>{query.data.live.creator.displayName}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Viewers</Text>
                <Text style={metaValueStyle}>{query.data.live.viewerCount}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Chat</Text>
                <Text style={metaValueStyle}>{query.data.chatEnabled ? 'Enabled' : 'Unavailable'}</Text>
              </View>
            </View>
          </Surface>
          <Surface>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Streaming and chat can mount here once your realtime and media providers are connected.
            </Text>
            <Text style={sectionTitleStyle}>Chat area</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              This reserved panel is where live chat messages and composer controls will render after realtime integration.
            </Text>
            {query.data.hostNotes?.length ? (
              <View style={{ gap: 10 }}>
                <Text style={sectionTitleStyle}>Host notes</Text>
                {query.data.hostNotes.map((note, index) => (
                  <Surface key={`${note}-${index}`}>
                    <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{note}</Text>
                  </Surface>
                ))}
              </View>
            ) : null}
          </Surface>
        </>
      ) : null}
    </Screen>
  );
}

export function ContentDetailsScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const query = useQuery({
    queryKey: ['mobile-content', contentId],
    queryFn: () => mobileApi.getPremiumContentDetail(contentId),
    enabled: Boolean(contentId),
  });

  return (
    <Screen>
      {query.isLoading ? <LoadingState label="Loading content..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Content unavailable" /> : null}
      {query.data ? (
        <>
          <Heading body={query.data.content.description} eyebrow="Premium content" title={query.data.content.title} />
          <Surface>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Creator</Text>
                <Text style={metaValueStyle}>{query.data.content.creator.displayName}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Category</Text>
                <Text style={metaValueStyle}>{getCategoryTitle(query.data.content.category)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Price</Text>
                <Text style={metaValueStyle}>{formatCurrency(query.data.content.price)}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Attachments</Text>
                <Text style={metaValueStyle}>{query.data.content.attachmentCount}</Text>
              </View>
            </View>
          </Surface>
          <Surface>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              {query.data.content.accessGranted
                ? 'Unlocked state active. Attachments or replay access can render here.'
                : 'Payment is required before this content becomes accessible.'}
            </Text>
            <Button
              onPress={() =>
                query.data.content.accessGranted
                  ? undefined
                  : router.push({
                      pathname: '/(viewer)/checkout',
                      params: { productId: contentId, productType: 'content' },
                    })
              }
              title={query.data.content.accessGranted ? 'Open content' : 'Continue to checkout'}
            />
          </Surface>
        </>
      ) : null}
    </Screen>
  );
}

export function ClassDetailsScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const query = useQuery({
    queryKey: ['mobile-class', classId],
    queryFn: () => mobileApi.getClassDetail(classId),
    enabled: Boolean(classId),
  });

  return (
    <Screen>
      {query.isLoading ? <LoadingState label="Loading class..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Class unavailable" /> : null}
      {query.data ? (
        <>
          <Heading body={query.data.classItem.description} eyebrow="Class" title={query.data.classItem.title} />
          <Surface>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Teacher</Text>
                <Text style={metaValueStyle}>{query.data.classItem.creator.displayName}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Category</Text>
                <Text style={metaValueStyle}>{getCategoryTitle(query.data.classItem.category)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Schedule</Text>
                <Text style={metaValueStyle}>{query.data.classItem.scheduleLabel}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={metaLabelStyle}>Price</Text>
                <Text style={metaValueStyle}>{formatCurrency(query.data.classItem.price)}</Text>
              </View>
            </View>
          </Surface>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Lessons</Text>
            {query.data.classItem.lessons.length ? (
              query.data.classItem.lessons.map((lesson) => (
                <Surface key={lesson.id}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>{lesson.title}</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{lesson.durationLabel}</Text>
                </Surface>
              ))
            ) : (
              <EmptyState body="Lessons will appear here when returned by the backend." title="No lessons yet" />
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={sectionTitleStyle}>Materials</Text>
            {query.data.classItem.materials.length ? (
              query.data.classItem.materials.map((material, index) => (
                <Surface key={`${material}-${index}`}>
                  <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{material}</Text>
                </Surface>
              ))
            ) : (
              <EmptyState body="Class materials will appear here after enrollment-ready data is returned." title="No materials yet" />
            )}
          </View>
          <Button
            onPress={() =>
              query.data.classItem.accessGranted
                ? undefined
                : router.push({
                    pathname: '/(viewer)/checkout',
                    params: { productId: classId, productType: 'class' },
                  })
            }
            title={query.data.classItem.accessGranted ? 'Continue class' : 'Continue to checkout'}
          />
        </>
      ) : null}
    </Screen>
  );
}

export function NotificationsScreen() {
  const query = useQuery({
    queryKey: ['mobile-notifications'],
    queryFn: mobileApi.getNotifications,
  });

  return (
    <Screen>
      <Heading body="Live reminders, purchases, announcements, and payout updates." eyebrow="Notifications" title="Updates" />
      {query.isLoading ? <LoadingState label="Loading notifications..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Notifications unavailable" /> : null}
      {query.data ? (
        query.data.items.length ? (
          query.data.items.map((item) => <NotificationRow item={item} key={item.id} />)
        ) : (
          <EmptyState body="Notification records will appear here from the backend." title="No notifications yet" />
        )
      ) : null}
    </Screen>
  );
}

export function ViewerWalletScreen() {
  const query = useQuery({
    queryKey: ['mobile-viewer-transactions'],
    queryFn: mobileApi.getViewerDashboard,
  });

  const totalSpend =
    query.data?.transactions.items.reduce((sum, item) => sum + (item.status === 'paid' ? item.amount : 0), 0) ?? 0;
  const latestPurchase = query.data?.transactions.items[0];

  return (
    <Screen>
      <Heading body="Purchases and transaction history remain visible without clutter." eyebrow="Wallet" title="Transactions" />
      {query.isLoading ? <LoadingState label="Loading transactions..." /> : null}
      {query.isError ? <EmptyState body={(query.error as Error).message} title="Wallet unavailable" /> : null}
      {query.data ? (
        query.data.transactions.items.length ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <SummaryTile
                body="Total paid value connected to lives, content, and classes."
                label="Total spend"
                value={formatCurrency(totalSpend)}
              />
              <SummaryTile
                body="Successful purchase records in your history."
                label="Purchases"
                value={String(query.data.transactions.items.length)}
              />
              <SummaryTile
                body="Most recent item in your checkout history."
                label="Latest"
                value={latestPurchase ? latestPurchase.title : 'No purchases yet'}
              />
            </View>
            <Surface>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Checkout confidence</Text>
              <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
                LiveGate keeps payment, unlocks, and access grants connected so your wallet history explains why an
                item appears in the library.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Button onPress={() => router.push('/(viewer)/(tabs)/library')} title="Open library" />
                <Button onPress={() => router.push('/(viewer)/(tabs)/search')} title="Find more content" variant="secondary" />
              </View>
            </Surface>
            {query.data.transactions.items.map((item) => (
              <TransactionRow item={item} key={item.id} />
            ))}
          </>
        ) : (
          <EmptyState body="Transactions appear here after purchases are completed." title="No transactions yet" />
        )
      ) : null}
    </Screen>
  );
}

export function CheckoutScreen() {
  const { productId, productType } = useLocalSearchParams<{
    productId: string;
    productType: 'live' | 'content' | 'class';
  }>();
  const [confirmed, setConfirmed] = useState(false);
  const mutation = useQuery({
    queryKey: ['mobile-checkout', productId, productType],
    queryFn: () =>
      mobileApi.createCheckout({
        productId,
        productType,
      }),
    enabled: Boolean(productId && productType),
  });

  return (
    <Screen>
      <Heading
        body="Review the purchase summary, commission split, and access rule before payment is completed."
        eyebrow="Checkout"
        title="Secure checkout session"
      />
      {!productId || !productType ? (
        <EmptyState
          body="Open checkout from a live, premium content item, or class details screen."
          title="No product selected"
        />
      ) : null}
      {mutation.isLoading ? <LoadingState label="Creating checkout session..." /> : null}
      {mutation.isError ? <EmptyState body={(mutation.error as Error).message} title="Checkout unavailable" /> : null}
      {mutation.data ? (
        <>
          <Surface>
            <Text style={metaLabelStyle}>Session id</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#10211D' }}>{mutation.data.id}</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>{mutation.data.accessPolicy}</Text>
          </Surface>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <SummaryTile
              body="What the buyer is charged at checkout."
              label="Total"
              value={formatCurrency(mutation.data.totalAmount ?? mutation.data.amount, mutation.data.currency)}
            />
            <SummaryTile
              body="Platform share retained after successful payment."
              label="Platform commission"
              value={formatCurrency(mutation.data.platformCommissionAmount ?? 0, mutation.data.currency)}
            />
            <SummaryTile
              body="Creator share after LiveGate commission."
              label="Creator earnings"
              value={formatCurrency(mutation.data.creatorEarningsAmount ?? 0, mutation.data.currency)}
            />
            <SummaryTile
              body="Category connected to the item being unlocked."
              label="Category"
              value={mutation.data.category ? getCategoryTitle(mutation.data.category) : 'General'}
            />
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#10211D' }}>{mutation.data.title}</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
              Creator: {mutation.data.creatorName ?? 'LiveGate creator'}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
              Product type: {productType}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
              Once payment succeeds, LiveGate verifies access before the item appears in your library.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button onPress={() => setConfirmed(true)} title="Confirm payment preview" />
              <Button onPress={() => router.replace('/(viewer)/(tabs)/library')} title="Return to library" variant="secondary" />
              <Button onPress={() => router.back()} title="Back" variant="ghost" />
            </View>
          </Surface>
          {confirmed ? (
            <Surface>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#196B59' }}>Payment preview completed</Text>
              <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
                This demo flow simulates a successful payment state. In production, the backend verifies the transaction
                before room join, content unlock, or class enrollment becomes active.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Button onPress={() => router.replace('/(viewer)/(tabs)/library')} title="Go to library" />
                <Button onPress={() => router.push('/(viewer)/notifications')} title="Open notifications" variant="secondary" />
              </View>
            </Surface>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

export function SettingsScreen() {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const query = useQuery({
    queryKey: ['mobile-profile-settings', session?.user.id, 'viewer'],
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
      <Heading body="Quiet account controls without a cluttered settings maze." eyebrow="Settings" title="Preferences" />
      {query.isLoading ? <LoadingState label="Loading settings..." /> : null}
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
              body="Remind me before scheduled live sessions begin."
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
              body="Show purchases, unlock confirmations, and billing updates."
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
              body="Receive creator class, live, and content announcements."
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
              body="Use tighter spacing in dashboard-heavy screens."
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
              body="Keep your profile visible to the wider learning community."
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
          </View>
          <Surface>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>Current profile posture</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>
              Default role: {settings.defaultRole}. Theme: {settings.appearancePreferences.theme}. Compact mode:{' '}
              {settings.appearancePreferences.compactMode ? 'enabled' : 'disabled'}.
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
