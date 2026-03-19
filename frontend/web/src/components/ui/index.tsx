import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const variants = {
    primary:
      'border border-text bg-text text-canvas shadow-lift hover:-translate-y-0.5 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-text/20',
    secondary:
      'border border-stroke bg-surface/90 text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:-translate-y-0.5 hover:bg-surface-muted/90 focus-visible:ring-2 focus-visible:ring-text/10',
    ghost:
      'border border-transparent bg-transparent text-muted hover:bg-surface-muted/70 hover:text-text focus-visible:ring-2 focus-visible:ring-text/10',
    danger:
      'border border-danger bg-danger text-white shadow-lift hover:-translate-y-0.5 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-danger/20',
  };

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition duration-200 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx('surface-panel rounded-[30px] border border-stroke/90 p-6 shadow-soft', className)}>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-[22px] border border-stroke bg-white/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/80 focus:border-text focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(23,21,18,0.05)]"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-28 w-full rounded-[22px] border border-stroke bg-white/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/80 focus:border-text focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(23,21,18,0.05)]"
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: 'default' | 'accent' | 'success' | 'warning' }>) {
  const tones = {
    default: 'bg-surface-muted text-muted',
    accent: 'bg-accent-muted text-accent',
    success: 'bg-green-100/80 text-success dark:bg-green-950/40',
    warning: 'bg-amber-100/90 text-warning dark:bg-amber-950/40',
  };

  return <span className={cx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', tones[tone])}>{children}</span>;
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card className="space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="text-3xl font-semibold tracking-[-0.03em]">{value}</p>
      {detail ? <p className="text-sm text-muted">{detail}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-56 flex-col items-start justify-center gap-4">
      <Badge tone="accent">Ready for live data</Badge>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="max-w-2xl text-sm leading-6 text-muted">{body}</p>
      </div>
      {action}
    </Card>
  );
}

export function LoadingBlock({ lines = 4 }: { lines?: number }) {
  return (
    <Card className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cx(
            'h-3 rounded-full bg-surface-muted',
            index === 0 ? 'w-24' : index === lines - 1 ? 'w-3/5' : 'w-full',
          )}
        />
      ))}
    </Card>
  );
}

export function InlineNotice({
  title,
  body,
  tone = 'default',
}: {
  title: string;
  body: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div
      className={cx(
        'rounded-[26px] border px-4 py-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
        tone === 'danger'
          ? 'border-danger/30 bg-danger/10 text-danger'
          : 'border-stroke bg-surface-muted text-muted',
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 leading-6">{body}</p>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-[34px] border border-white/20 bg-surface p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-stroke bg-surface-muted/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      {items.map((item) => (
        <button
          key={item.value}
          className={cx(
            'rounded-full px-4 py-2 text-sm font-medium transition',
            value === item.value ? 'bg-surface text-text shadow-lift' : 'text-muted hover:text-text',
          )}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p> : null}
        <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em]">{title}</h2>
        {body ? <p className="max-w-2xl text-sm leading-6 text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}
