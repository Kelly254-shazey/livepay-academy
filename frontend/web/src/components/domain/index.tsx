import type {
  ClassSummary,
  CreatorSummary,
  LiveSessionSummary,
  NotificationRecord,
  PremiumContentSummary,
  TransactionRecord,
  WalletSummary,
} from '@livegate/shared';
import { formatCompactNumber, formatCurrency, formatDateTime } from '@livegate/shared';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, EmptyState } from '@/components/ui';

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
  return (
    <Card className="space-y-5 transition duration-200 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <Badge tone={live.isLive ? 'success' : 'accent'}>{live.isLive ? 'Live now' : 'Upcoming'}</Badge>
        <p className="text-sm text-muted">{formatCurrency(live.price)}</p>
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

export function LiveChatPanel({ messages }: { messages?: Array<{ id: string; author: string; message: string }> }) {
  if (!messages?.length) {
    return (
      <EmptyState
        title="Live chat placeholder"
        body="The chat panel is ready for websocket events. Messages will appear here once the live-room feed is connected."
      />
    );
  }

  return (
    <Card className="space-y-3">
      {messages.map((message) => (
        <div className="rounded-2xl bg-surface-muted/70 p-3" key={message.id}>
          <p className="text-sm font-medium">{message.author}</p>
          <p className="mt-1 text-sm text-muted">{message.message}</p>
        </div>
      ))}
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
