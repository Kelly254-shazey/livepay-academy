import type {
  ClassSummary,
  CreatorSummary,
  LiveChatMessageRecord,
  LiveSessionSummary,
  ManagedContentRecord,
  NotificationRecord,
  PremiumContentSummary,
  TransactionRecord,
  WalletSummary,
} from '../../lib/shared';
import { formatCompactNumber, formatCurrency, formatDateTime } from '../../lib/shared';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui';

export function CategoryPill({ title, href }: { title: string; href: string }) {
  return (
    <Link className="rounded-full border border-stroke bg-surface/70 px-4 py-2 text-sm font-medium text-muted transition hover:-translate-y-0.5 hover:border-text/30 hover:bg-surface hover:text-text" to={href}>
      {title}
    </Link>
  );
}

export function CreatorCard({ creator }: { creator: CreatorSummary }) {
  return (
    <Card className="space-y-5 transition duration-200 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em]">{creator.displayName}</h3>
            {creator.verificationStatus === 'verified' ? <Badge tone="success">Verified</Badge> : null}
          </div>
          <p className="text-sm text-muted">@{creator.handle}</p>
        </div>
        <Badge tone="accent">{formatCompactNumber(creator.followerCount)} followers</Badge>
      </div>
      <p className="text-sm leading-6 text-muted">{creator.headline}</p>
      <div className="flex flex-wrap gap-2">
        {creator.categories.map((category) => (
          <Badge key={category}>{category.replace(/-/g, ' ')}</Badge>
        ))}
      </div>
      <Link to={`/creators/${creator.id}`}>
        <Button className="w-full">View profile</Button>
      </Link>
    </Card>
  );
}

export function LiveCard({ live }: { live: LiveSessionSummary }) {
  const pricingLabel = live.isPaid ? formatCurrency(live.price, live.currency) : 'Free';

  return (
    <Card className="space-y-5 transition duration-200 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <Badge tone={live.isLive ? 'success' : 'accent'}>{live.isLive ? 'Live now' : 'Upcoming'}</Badge>
        <div className="text-right">
          <p className="text-sm text-muted">{pricingLabel}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{live.isPaid ? 'Paid live' : 'Free live'}</p>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-[-0.03em]">{live.title}</h3>
        <p className="text-sm leading-6 text-muted">{live.description}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{live.creator.displayName}</span>
        <span>{formatDateTime(live.startTime)}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{formatCompactNumber(live.viewerCount)} watching</span>
        <span>{live.category.replace(/-/g, ' ')}</span>
      </div>
      <Link to={`/lives/${live.id}`}>
        <Button className="w-full">{live.accessGranted ? 'Open live room' : 'View live details'}</Button>
      </Link>
    </Card>
  );
}

export function ContentCard({ content }: { content: PremiumContentSummary }) {
  return (
    <Card className="space-y-5 transition duration-200 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <Badge tone="accent">Premium content</Badge>
        <span className="text-sm text-muted">{formatCurrency(content.price)}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-[-0.03em]">{content.title}</h3>
        <p className="text-sm leading-6 text-muted">{content.description}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{content.creator.displayName}</span>
        <span>{content.attachmentCount} attachments</span>
      </div>
      <Link to={`/content/${content.id}`}>
        <Button className="w-full">{content.accessGranted ? 'Open content' : 'Unlock access'}</Button>
      </Link>
    </Card>
  );
}

export function ClassCard({ classItem }: { classItem: ClassSummary }) {
  return (
    <Card className="space-y-5 transition duration-200 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <Badge tone="warning">Class</Badge>
        <span className="text-sm text-muted">{formatCurrency(classItem.price)}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-[-0.03em]">{classItem.title}</h3>
        <p className="text-sm leading-6 text-muted">{classItem.description}</p>
      </div>
      <div className="text-sm text-muted">{classItem.scheduleLabel}</div>
      <Link to={`/classes/${classItem.id}`}>
        <Button className="w-full">{classItem.accessGranted ? 'Continue class' : 'View class'}</Button>
      </Link>
    </Card>
  );
}

export function WalletSummaryCards({ wallet }: { wallet: WalletSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Available</p>
        <p className="mt-2 text-3xl font-semibold">{formatCurrency(wallet.availableBalance, wallet.currency)}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Pending</p>
        <p className="mt-2 text-3xl font-semibold">{formatCurrency(wallet.pendingBalance, wallet.currency)}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Lifetime</p>
        <p className="mt-2 text-3xl font-semibold">{formatCurrency(wallet.lifetimeEarnings, wallet.currency)}</p>
      </Card>
    </div>
  );
}

export function ManagedContentGrid({
  items,
  emptyTitle,
  emptyBody,
  showCreator = false,
}: {
  items: ManagedContentRecord[];
  emptyTitle: string;
  emptyBody: string;
  showCreator?: boolean;
}) {
  if (!items.length) {
    return <EmptyState body={emptyBody} title={emptyTitle} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card className="space-y-4" key={`${item.kind}-${item.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.kind === 'live' ? 'accent' : item.kind === 'class' ? 'warning' : 'success'}>
                {item.kind}
              </Badge>
              <Badge>{item.status.replace(/_/g, ' ')}</Badge>
            </div>
            <span className="text-sm font-medium text-text">{formatCurrency(item.price, item.currency)}</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
            <p className="text-sm text-muted">{item.deliveryLabel ?? item.category.replace(/-/g, ' ')}</p>
          </div>
          <div className="space-y-1 text-sm text-muted">
            <p>Category: {item.category.replace(/-/g, ' ')}</p>
            {item.scheduleLabel ? <p>{item.scheduleLabel}</p> : null}
            {showCreator ? <p>Creator: {item.creatorName}</p> : null}
            <p>Created: {formatDateTime(item.createdAt)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TransactionTable({ items }: { items: TransactionRecord[] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="No transactions yet"
        body="This table is wired for real payment and payout records once your API is connected."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-muted">
          <tr>
            <th className="px-5 py-4 font-medium">Title</th>
            <th className="px-5 py-4 font-medium">Type</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Amount</th>
            <th className="px-5 py-4 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-t border-stroke" key={item.id}>
              <td className="px-5 py-4">{item.title}</td>
              <td className="px-5 py-4 capitalize text-muted">{item.type}</td>
              <td className="px-5 py-4 capitalize text-muted">{item.status}</td>
              <td className="px-5 py-4">{formatCurrency(item.amount, item.currency)}</td>
              <td className="px-5 py-4 text-muted">{formatDateTime(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function NotificationsPanel({ items }: { items: NotificationRecord[] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="No notifications available"
        body="Reminders, purchases, creator announcements, and payout updates will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card className="space-y-2" key={item.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
            </div>
            <Badge tone={item.read ? 'default' : 'accent'}>{item.read ? 'Read' : 'New'}</Badge>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{formatDateTime(item.createdAt)}</p>
        </Card>
      ))}
    </div>
  );
}

export function LiveChatPanel({
  messages = [],
  viewerCount,
  chatEnabled = true,
  connectionState = 'idle',
  connectionMessage,
  draft = '',
  onDraftChange,
  onSend,
  sendDisabled = false,
}: {
  messages?: LiveChatMessageRecord[];
  viewerCount?: number;
  chatEnabled?: boolean;
  connectionState?: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionMessage?: string | null;
  draft?: string;
  onDraftChange?: (value: string) => void;
  onSend?: () => void;
  sendDisabled?: boolean;
}) {
  const statusTone =
    connectionState === 'connected'
      ? 'success'
      : connectionState === 'error'
        ? 'danger'
        : connectionState === 'disconnected'
          ? 'warning'
          : 'default';
  const statusLabel =
    connectionState === 'connected'
      ? 'Realtime synced'
      : connectionState === 'connecting'
        ? 'Connecting'
        : connectionState === 'disconnected'
          ? 'Disconnected'
          : connectionState === 'error'
            ? 'Connection issue'
            : 'Ready';

  return (
    <Card className="flex h-full min-h-[32rem] flex-col gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-stroke px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.03em]">Live chat</h3>
          <p className="mt-1 text-sm text-muted">
            {typeof viewerCount === 'number' ? `${formatCompactNumber(viewerCount)} viewers in the room` : 'Room conversation'}
          </p>
        </div>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface-muted/35 px-5 py-5">
        {messages.length ? (
          messages.map((message) => (
            <div className="rounded-2xl bg-white/75 p-3 shadow-[0_10px_30px_rgba(16,33,29,0.06)]" key={message.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{message.authorName}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{formatDateTime(message.sentAt)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{message.body}</p>
            </div>
          ))
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-[28px] border border-dashed border-stroke bg-white/55 px-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">No messages yet</p>
              <p className="text-sm leading-6 text-muted">
                {chatEnabled
                  ? 'Be the first person to say something in this room.'
                  : 'Chat will unlock automatically when the host is fully live.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-stroke px-5 py-4">
        {connectionMessage ? <p className="text-sm leading-6 text-muted">{connectionMessage}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            onChange={(event) => onDraftChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend?.();
              }
            }}
            placeholder={chatEnabled ? 'Type a message for the room' : 'Chat becomes active when the live session starts'}
            value={draft}
          />
          <Button disabled={sendDisabled} onClick={onSend} type="button">
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PaymentGateCard({
  title,
  price,
  body,
  onContinue,
  disabled,
}: {
  title: string;
  price: string;
  body: string;
  onContinue: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="space-y-4">
      <Badge tone="accent">Payment required</Badge>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm leading-6 text-muted">{body}</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-semibold">{price}</span>
        <Button disabled={disabled} onClick={onContinue}>
          Continue to checkout
        </Button>
      </div>
    </Card>
  );
}
