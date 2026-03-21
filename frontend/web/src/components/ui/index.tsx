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
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const variants = {
    primary:
      'border border-accent/60 bg-accent text-surface shadow-glass hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-glass-lg focus-visible:ring-2 focus-visible:ring-accent/20',
    secondary:
      'border border-white/40 bg-white/25 text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/35 hover:border-white/55 focus-visible:ring-2 focus-visible:ring-text/10',
    ghost:
      'border border-transparent bg-transparent text-muted hover:bg-white/20 hover:text-text focus-visible:ring-2 focus-visible:ring-text/10',
    danger:
      'border border-danger/60 bg-danger text-white shadow-[0_14px_36px_rgba(166,75,64,0.2)] hover:-translate-y-0.5 hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/20',
    success:
      'border border-success/60 bg-success text-white shadow-[0_14px_36px_rgba(25,107,89,0.18)] hover:-translate-y-0.5 hover:bg-success/90 focus-visible:ring-2 focus-visible:ring-success/20',
  };
  const sizes = {
    sm: 'rounded-full px-3.5 py-2 text-sm',
    md: 'rounded-full px-4.5 py-2.5 text-sm',
    lg: 'rounded-full px-6 py-3.5 text-base',
  };

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition duration-200 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx('glass-card rounded-[28px] p-6 shadow-glass sm:p-7', className)}>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition placeholder:text-muted/80 focus:border-white/60 focus:bg-white/40 focus:shadow-[0_0_0_4px_rgba(16,33,29,0.08)]"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-28 w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition placeholder:text-muted/80 focus:border-white/60 focus:bg-white/40 focus:shadow-[0_0_0_4px_rgba(16,33,29,0.08)]"
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' }>) {
  const tones = {
    default: 'border-white/35 bg-white/20 text-text',
    accent: 'border-accent/20 bg-accent/12 text-accent',
    success: 'border-success/20 bg-success/12 text-success',
    warning: 'border-warning/20 bg-warning/12 text-warning',
    danger: 'border-danger/20 bg-danger/12 text-danger',
  };

  return (
    <span className={cx('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl', tones[tone])}>
      {children}
    </span>
  );
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
        'rounded-[26px] border px-4 py-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl',
        tone === 'danger'
          ? 'border-danger/25 bg-danger/12 text-danger'
          : 'border-white/35 bg-white/20 text-muted',
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
      <div className="glass-full w-full max-w-lg rounded-[34px] p-6 shadow-panel">
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
    <div className="inline-flex rounded-full border border-white/35 bg-white/22 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl">
      {items.map((item) => (
        <button
          key={item.value}
          className={cx(
            'rounded-full px-4 py-2 text-sm font-medium transition',
            value === item.value ? 'bg-white/55 text-text shadow-glass' : 'text-muted hover:text-text',
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
