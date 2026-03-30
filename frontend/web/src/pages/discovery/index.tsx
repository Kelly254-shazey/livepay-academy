import { categories, formatCurrency, formatDateTime } from '../../lib/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout';
import {
  ClassCard,
  ContentCard,
  CreatorCard,
  LiveCard,
  LiveChatPanel,
  PaymentGateCard,
} from '@/components/domain';
import { useLiveRoomRealtime } from '@/hooks/use-live-room-realtime';
import { webApi } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  SectionTitle,
  Tabs,
} from '@/components/ui';

export function CategoryPage() {
  const params = useParams();
  const [tab, setTab] = useState('creators');
  const [query, setQuery] = useState('');

  const category = categories.find((item) => item.slug === params.slug);
  const categoryQuery = useQuery({
    queryKey: ['category', params.slug],
    queryFn: () => webApi.getCategoryDetail(params.slug ?? ''),
    enabled: Boolean(params.slug),
  });

  const filtered = useMemo(() => {
    const payload = categoryQuery.data;
    const needle = query.trim().toLowerCase();

    if (!payload || !needle) return payload;

    return {
      ...payload,
      creators: {
        ...payload.creators,
        items: payload.creators.items.filter((item) =>
          `${item.displayName} ${item.headline}`.toLowerCase().includes(needle),
        ),
      },
      lives: {
        ...payload.lives,
        items: payload.lives.items.filter((item) =>
          `${item.title} ${item.description}`.toLowerCase().includes(needle),
        ),
      },
      premiumContent: {
        ...payload.premiumContent,
        items: payload.premiumContent.items.filter((item) =>
          `${item.title} ${item.description}`.toLowerCase().includes(needle),
        ),
      },
      classes: {
        ...payload.classes,
        items: payload.classes.items.filter((item) =>
          `${item.title} ${item.description}`.toLowerCase().includes(needle),
        ),
      },
    };
  }, [categoryQuery.data, query]);

  const tabMap = {
    creators: filtered?.creators.items.map((item) => <CreatorCard creator={item} key={item.id} />),
    lives: filtered?.lives.items.map((item) => <LiveCard key={item.id} live={item} />),
    content: filtered?.premiumContent.items.map((item) => <ContentCard content={item} key={item.id} />),
    classes: filtered?.classes.items.map((item) => <ClassCard classItem={item} key={item.id} />),
  } as const;

  return (
    <PageFrame>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <Card className="space-y-4">
          <Badge tone="accent">Category</Badge>
          <SectionTitle
            body={category?.shortDescription ?? 'Dedicated browsing, pricing clarity, and role-aware access within this category.'}
            title={category?.title ?? 'Category'}
          />
          <div className="flex flex-wrap gap-3">
            <Tabs
              items={[
                { label: 'Creators', value: 'creators' },
                { label: 'Lives', value: 'lives' },
                { label: 'Content', value: 'content' },
                { label: 'Classes', value: 'classes' },
              ]}
              onChange={setTab}
              value={tab}
            />
            <div className="min-w-60 flex-1">
              <Input onChange={(event) => setQuery(event.target.value)} placeholder="Filter within this category" value={query} />
            </div>
          </div>
        </Card>

        {categoryQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingBlock key={index} lines={5} />
            ))}
          </div>
        ) : categoryQuery.isError ? (
          <EmptyState title="Category unavailable" body={(categoryQuery.error as Error).message} />
        ) : tabMap[tab as keyof typeof tabMap]?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tabMap[tab as keyof typeof tabMap]}</div>
        ) : (
          <EmptyState
            title="Nothing to show yet"
            body="This category page is connected to the API and waiting for backend results."
          />
        )}
      </div>
    </PageFrame>
  );
}

export function CreatorProfilePage() {
  const params = useParams();
  const query = useQuery({
    queryKey: ['creator', params.creatorId],
    queryFn: () => webApi.getCreatorProfile(params.creatorId ?? ''),
    enabled: Boolean(params.creatorId),
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {query.isLoading ? (
          <LoadingBlock lines={8} />
        ) : query.isError ? (
          <EmptyState title="Creator unavailable" body={(query.error as Error).message} />
        ) : query.data ? (
          <>
            <Card className="space-y-6 overflow-hidden">
              <div className="h-36 rounded-[24px] bg-gradient-to-r from-accent-muted via-surface-muted to-surface" />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-xl font-semibold">
                      {query.data.creator.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-semibold">{query.data.creator.displayName}</h1>
                        {query.data.creator.verificationStatus === 'verified' ? <Badge tone="success">Verified</Badge> : null}
                      </div>
                      <p className="text-sm text-muted">@{query.data.creator.handle}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {query.data.creator.categories.map((category) => (
                      <Badge key={category}>{category.replace(/-/g, ' ')}</Badge>
                    ))}
                  </div>
                  <p className="max-w-3xl text-sm leading-7 text-muted">{query.data.creator.bio ?? query.data.creator.headline}</p>
                </div>
                <div className="space-y-2 text-sm text-muted">
                  <p>{query.data.creator.followerCount} followers</p>
                  <p>{query.data.creator.reviewCount} reviews</p>
                </div>
              </div>
              <Button>Follow creator</Button>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title="Reviews" body="Social proof and trust stay visible without overwhelming the page." />
              {query.data.reviews.items.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {query.data.reviews.items.map((review) => (
                    <div className="rounded-2xl border border-stroke p-4" key={review.id}>
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{review.authorName}</p>
                        <Badge tone="accent">{review.rating}/5</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No reviews yet" body="Creator reviews will render here when returned by the API." />
              )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              {query.data.upcomingLives.items.map((item) => <LiveCard key={item.id} live={item} />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {query.data.premiumContent.items.map((item) => <ContentCard content={item} key={item.id} />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {query.data.classes.items.map((item) => <ClassCard classItem={item} key={item.id} />)}
            </div>
          </>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function LiveDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['live', params.liveId],
    queryFn: () => webApi.getLiveDetail(params.liveId ?? ''),
    enabled: Boolean(params.liveId),
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {query.isLoading ? (
          <LoadingBlock lines={7} />
        ) : query.isError ? (
          <EmptyState title="Live session unavailable" body={(query.error as Error).message} />
        ) : query.data ? (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={query.data.live.isLive ? 'success' : 'accent'}>
                  {query.data.live.isLive
                    ? 'Live now'
                    : query.data.live.endTime
                      ? 'Ended live'
                      : query.data.live.isPaid
                        ? 'Upcoming paid live'
                        : 'Upcoming free live'}
                </Badge>
                <Badge>{query.data.live.isPaid ? 'Paid access' : 'Free access'}</Badge>
              </div>
              <SectionTitle body={query.data.live.description} title={query.data.live.title} />
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span>{query.data.live.creator.displayName}</span>
                <span>{query.data.live.viewerCount} viewers</span>
                <span>{query.data.live.category.replace(/-/g, ' ')}</span>
                <span>{query.data.live.isPaid ? formatCurrency(query.data.live.price, query.data.live.currency) : 'Free'}</span>
              </div>
            </Card>
            {query.data.live.accessGranted ? (
              <Button onClick={() => navigate(`/lives/${query.data?.live.id}/room`)}>
                {query.data.live.isLive ? 'Join live room' : 'Open live room'}
              </Button>
            ) : !query.data.live.isPaid ? (
              <Card className="space-y-4">
                <Badge tone="warning">Access controlled by visibility</Badge>
                <p className="text-sm leading-7 text-muted">
                  This live is free, but the backend still enforces the creator visibility rules. Follow the creator or
                  wait for a private invite, then refresh access.
                </p>
                <Button onClick={() => void query.refetch()} variant="secondary">
                  Refresh access
                </Button>
              </Card>
            ) : (
              <PaymentGateCard
                body="Users must pay before joining paid live sessions. This flow is wired to the checkout endpoint and honors creator-set pricing."
                onContinue={() => setOpen(true)}
                price={`Price: ${formatCurrency(query.data.live.price, query.data.live.currency)}`}
                title="Unlock access"
              />
            )}
            <Modal onClose={() => setOpen(false)} open={open} title="Join paid live">
              <div className="space-y-4">
                <p className="text-sm leading-7 text-muted">
                  Checkout is ready for the payment endpoint. Redirect to the checkout route to complete payment and unlock the live room.
                </p>
                <Button onClick={() => navigate(`/checkout?productType=live&productId=${query.data?.live.id}`)}>
                  Continue to checkout
                </Button>
              </div>
            </Modal>
          </>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function LiveRoomPage() {
  const params = useParams();
  const [chatDraft, setChatDraft] = useState('');
  const [chatFeedback, setChatFeedback] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['live-room', params.liveId],
    queryFn: () => webApi.getLiveRoom(params.liveId ?? ''),
    enabled: Boolean(params.liveId),
  });
  const realtime = useLiveRoomRealtime({
    liveId: params.liveId,
    enabled: Boolean(params.liveId && query.data?.live.accessGranted),
    realtimeEnabled: Boolean(
      params.liveId && query.data?.live.accessGranted && query.data?.roomAccessToken && query.data?.chatEnabled,
    ),
    roomAccessToken: query.data?.roomAccessToken,
    initialViewerCount: query.data?.live.viewerCount ?? 0,
  });

  const handleSendChatMessage = () => {
    if (!params.liveId || !chatDraft.trim() || !query.data) {
      return;
    }

    if (!query.data.chatEnabled) {
      setChatFeedback('Chat is paused until this live session is fully active.');
      return;
    }

    if (realtime.connectionState !== 'connected') {
      setChatFeedback('Live chat is still connecting. Try again in a moment.');
      return;
    }

    try {
      realtime.sendMessage(chatDraft.trim());
      setChatDraft('');
      setChatFeedback(null);
    } catch (error) {
      setChatFeedback(error instanceof Error ? error.message : 'Unable to send message right now.');
    }
  };

  return (
    <PageFrame>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        {query.isLoading ? (
          <>
            <LoadingBlock lines={8} />
            <LoadingBlock lines={6} />
          </>
        ) : query.isError ? (
          <div className="lg:col-span-2">
            <EmptyState title="Live room unavailable" body={(query.error as Error).message} />
          </div>
        ) : query.data ? (
          <>
            <Card className="overflow-hidden p-0">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(240,180,42,0.22),_transparent_40%),linear-gradient(135deg,#172033_0%,#111827_55%,#10211d_100%)] px-6 py-6 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={query.data.live.isLive ? 'success' : 'warning'}>
                      {query.data.live.isLive ? 'Live now' : 'Room waiting for host'}
                    </Badge>
                    <Badge>{query.data.live.isPaid ? 'Paid live' : 'Free live'}</Badge>
                    <Badge>{query.data.chatEnabled ? 'Chat active' : 'Chat paused'}</Badge>
                  </div>
                  <p className="text-sm uppercase tracking-[0.18em] text-white/70">
                    {query.data.live.isPaid ? formatCurrency(query.data.live.price, query.data.live.currency) : 'Free'}
                  </p>
                </div>
                <div className="mt-6 space-y-4">
                  <SectionTitle body={query.data.live.description} title={query.data.live.title} />
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
                    <span>{query.data.live.creator.displayName}</span>
                    <span>{query.data.live.category.replace(/-/g, ' ')}</span>
                    <span>{formatDateTime(query.data.live.startTime)}</span>
                    <span>
                      {query.data.live.isLive ? realtime.viewerCount : query.data.live.viewerCount} viewers in room
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="flex min-h-[24rem] flex-col justify-between rounded-[30px] border border-white/10 bg-[#172033] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/60">Live stage</p>
                        <p className="mt-2 text-lg font-semibold">
                          {query.data.live.isLive ? 'Stream is active and viewers can chat in real time.' : 'The room is ready for the host.'}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
                        Room {query.data.roomId ?? 'pending'}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="max-w-2xl text-sm leading-7 text-white/72">
                        This stage is controlled by the backend room state. It stays aligned with the stored session
                        visibility, pricing, join access, and realtime viewer presence.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/60">Access</p>
                          <p className="mt-2 text-lg font-semibold">{query.data.live.accessGranted ? 'Granted' : 'Locked'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/60">Visibility</p>
                          <p className="mt-2 text-lg font-semibold">{(query.data.live.visibility ?? 'public').replace(/_/g, ' ')}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/60">Status</p>
                          <p className="mt-2 text-lg font-semibold">{query.data.live.isLive ? 'Broadcasting' : 'Waiting'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {query.data.hostNotes?.length ? (
                    <div className="rounded-[28px] border border-stroke bg-surface-muted/45 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Host notes</p>
                      <div className="mt-3 space-y-3">
                        {query.data.hostNotes.map((note) => (
                          <p className="rounded-2xl bg-white/65 px-4 py-3 text-sm leading-6 text-muted" key={note}>
                            {note}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-stroke bg-surface-muted/45 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Room summary</p>
                    <div className="mt-4 space-y-3 text-sm text-muted">
                      <div className="flex items-center justify-between gap-4">
                        <span>Viewer count</span>
                        <span className="font-medium text-text">
                          {query.data.live.isLive ? realtime.viewerCount : query.data.live.viewerCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Price model</span>
                        <span className="font-medium text-text">{query.data.live.isPaid ? 'Paid' : 'Free'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Starts</span>
                        <span className="font-medium text-text">{formatDateTime(query.data.live.startTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <LiveChatPanel
              chatEnabled={query.data.chatEnabled}
              connectionMessage={
                chatFeedback ??
                (!query.data.chatEnabled
                  ? 'Chat is available only while the host is actively live.'
                  : realtime.connectionError ??
                    (realtime.connectionState === 'connecting'
                      ? 'Connecting to secure live chat...'
                      : realtime.connectionState === 'disconnected'
                        ? 'Live connection dropped. Reconnecting when available.'
                        : null))
              }
              connectionState={query.data.chatEnabled ? realtime.connectionState : 'idle'}
              draft={chatDraft}
              messages={realtime.messages}
              onDraftChange={setChatDraft}
              onSend={handleSendChatMessage}
              sendDisabled={!query.data.chatEnabled || !chatDraft.trim() || realtime.connectionState !== 'connected'}
              viewerCount={query.data.live.isLive ? realtime.viewerCount : query.data.live.viewerCount}
            />
          </>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function PremiumContentPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['content', params.contentId],
    queryFn: () => webApi.getPremiumContentDetail(params.contentId ?? ''),
    enabled: Boolean(params.contentId),
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {query.isLoading ? (
          <LoadingBlock lines={7} />
        ) : query.isError ? (
          <EmptyState title="Content unavailable" body={(query.error as Error).message} />
        ) : query.data ? (
          <>
            <Card className="space-y-4">
              <Badge tone="accent">Premium content</Badge>
              <SectionTitle body={query.data.content.description} title={query.data.content.title} />
            </Card>
            {query.data.content.accessGranted ? (
              <Card>
                <p className="text-sm leading-7 text-muted">
                  Purchased state active. Attachments, downloadable materials, or replay embeds can render here from the real API payload.
                </p>
              </Card>
            ) : (
              <PaymentGateCard
                body="Users must pay before unlocking premium content. This flow routes into checkout and unlock status should come back from the backend."
                onContinue={() => setOpen(true)}
                price={`Price: ${query.data.content.price}`}
                title="Unlock premium content"
              />
            )}
            <Modal onClose={() => setOpen(false)} open={open} title="Unlock premium content">
              <div className="space-y-4">
                <Button onClick={() => navigate(`/checkout?productType=content&productId=${query.data?.content.id}`)}>
                  Continue to checkout
                </Button>
              </div>
            </Modal>
          </>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function ClassDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['class', params.classId],
    queryFn: () => webApi.getClassDetail(params.classId ?? ''),
    enabled: Boolean(params.classId),
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {query.isLoading ? (
          <LoadingBlock lines={7} />
        ) : query.isError ? (
          <EmptyState title="Class unavailable" body={(query.error as Error).message} />
        ) : query.data ? (
          <>
            <Card className="space-y-4">
              <Badge tone="warning">Class & workshop</Badge>
              <SectionTitle body={query.data.classItem.description} title={query.data.classItem.title} />
              <p className="text-sm text-muted">{query.data.classItem.scheduleLabel}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span>Teacher: {query.data.classItem.creator.displayName}</span>
                <span>Price: {query.data.classItem.price}</span>
              </div>
            </Card>
            <Card className="space-y-3">
              <p className="font-medium">Materials</p>
              {query.data.classItem.materials.length ? (
                query.data.classItem.materials.map((material) => (
                  <div className="rounded-2xl border border-stroke px-4 py-3 text-sm text-muted" key={material}>
                    {material}
                  </div>
                ))
              ) : (
                <EmptyState title="No materials returned" body="Course materials will render here once the backend provides them." />
              )}
            </Card>
            <Card className="space-y-3">
              <p className="font-medium">Lessons</p>
              {query.data.classItem.lessons.length ? (
                query.data.classItem.lessons.map((lesson) => (
                  <div className="flex items-center justify-between rounded-2xl border border-stroke px-4 py-3" key={lesson.id}>
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-sm text-muted">{lesson.durationLabel}</p>
                    </div>
                    <Badge tone={lesson.accessGranted ? 'success' : 'default'}>
                      {lesson.accessGranted ? 'Open' : 'Locked'}
                    </Badge>
                  </div>
                ))
              ) : (
                <EmptyState title="No lessons returned" body="Lesson payloads will render here once classes are available from the backend." />
              )}
            </Card>
            {query.data.classItem.accessGranted ? (
              <Card>
                <p className="text-sm leading-7 text-muted">
                  Enrolled state active. Continue learning, lesson progression, and materials can now render from the real API.
                </p>
              </Card>
            ) : (
              <PaymentGateCard
                body="Enrollment requires payment before lesson access is granted."
                onContinue={() => setOpen(true)}
                price={`Price: ${query.data.classItem.price}`}
                title="Enroll in class"
              />
            )}
            <Modal onClose={() => setOpen(false)} open={open} title="Enroll in class">
              <div className="space-y-4">
                <Button onClick={() => navigate(`/checkout?productType=class&productId=${query.data?.classItem.id}`)}>
                  Continue to checkout
                </Button>
              </div>
            </Modal>
          </>
        ) : null}
      </div>
    </PageFrame>
  );
}
