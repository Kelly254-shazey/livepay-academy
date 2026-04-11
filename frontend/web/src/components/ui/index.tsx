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
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) {
  const variants = {
    primary: 'bg-accent text-white border-accent hover:bg-accent-hover focus:ring-accent/20',
    secondary: 'bg-surface text-text border-border hover:bg-surface-muted focus:ring-accent/20',
    ghost: 'bg-transparent text-text border-transparent hover:bg-hover focus:ring-accent/20',
    danger: 'bg-danger text-white border-danger hover:bg-red-600 focus:ring-danger/20',
    success: 'bg-success text-white border-success hover:bg-green-600 focus:ring-success/20',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-2.5 text-base rounded-lg',
  };

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 font-semibold border transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx('bg-surface border border-border rounded-xl p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-28 w-full rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10"
      {...props}
    />
  );
}

export function Badge({
  children,
  variant,
  tone, // backward compatibility
}: PropsWithChildren<{ 
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'; // backward compatibility
}>) {
  // Use variant if provided, otherwise map tone to variant for backward compatibility
  const finalVariant = variant || (tone === 'accent' ? 'primary' : tone) || 'default';
  
  const variants = {
    default: 'bg-surface-muted text-text border-border',
    primary: 'bg-accent-muted text-accent border-accent/20',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={cx('inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full border', variants[finalVariant])}>
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
        'rounded-lg border px-4 py-3 text-sm',
        tone === 'danger'
          ? 'border-danger/20 bg-danger/10 text-danger'
          : 'border-stroke bg-surface-muted text-text',
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 leading-6 text-muted">{body}</p>
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
    <div className="inline-flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          className={cx(
            'rounded-full border px-4 py-2 text-sm font-medium transition',
            value === item.value
              ? 'border-text bg-text text-canvas'
              : 'border-stroke bg-surface text-muted hover:border-text hover:text-text',
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

type SelectOption = { value: string; label: string };

export function Select({
  label,
  placeholder,
  options,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
}) {
  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-medium block">{label}</label> : null}
      <select
        className="w-full rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Checkbox({
  label,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-stroke bg-surface p-4 cursor-pointer transition hover:border-text/30">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-accent rounded" {...props} />
      {label ? (
        <div className="flex-1">
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-sm leading-6 text-muted mt-1">{description}</p> : null}
        </div>
      ) : null}
    </label>
  );
}
