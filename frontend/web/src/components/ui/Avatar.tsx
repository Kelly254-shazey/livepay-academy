interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors = {
  online: 'bg-success',
  offline: 'bg-muted',
  away: 'bg-warning',
};

export function Avatar({
  src,
  alt = 'User avatar',
  initials,
  size = 'md',
  status,
}: AvatarProps) {
  return (
    <div className="relative inline-block">
      <div
        className={`
          ${sizeStyles[size]}
          rounded-full bg-gradient-to-br from-accent to-accent/50
          flex items-center justify-center overflow-hidden
          border-2 border-surface flex-shrink-0
        `}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="font-semibold text-surface">{initials}</span>
        )}
      </div>
      {status && (
        <div
          className={`
            absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
}
