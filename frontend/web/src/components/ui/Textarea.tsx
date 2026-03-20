import {
  type ChangeEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  forwardRef,
  useEffect,
  useState,
} from 'react';

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  count?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      count,
      maxLength,
      className,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(
      typeof props.value === 'string' ? props.value.length : 0
    );

    useEffect(() => {
      if (typeof props.value === 'string') {
        setCharCount(props.value.length);
      }
    }, [props.value]);

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(event.target.value.length);
      props.onChange?.(event);
    };

    return (
      <div className="w-full">
        {label ? (
          <label className="block text-sm font-medium text-text mb-2">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {icon ? (
            <div className="absolute left-3 top-3 text-muted flex-shrink-0">
              {icon}
            </div>
          ) : null}
          <textarea
            ref={ref}
            maxLength={maxLength}
            className={`
              w-full px-3 py-2 ${icon ? 'pl-10' : ''} rounded-lg
              border-2 border-stroke bg-surface text-text
              placeholder-muted placeholder-opacity-50
              focus:outline-none focus:border-accent
              transition-colors duration-200
              resize-vertical min-h-24
              disabled:bg-surface-muted disabled:cursor-not-allowed
              ${error ? 'border-error focus:border-error' : ''}
              ${className || ''}
            `}
            {...props}
            onChange={handleChange}
          />
        </div>
        {hint || error || count ? (
          <div
            className={`text-xs mt-1.5 flex items-center justify-between ${
              error ? 'text-error' : 'text-muted'
            }`}
          >
            <span>{error || hint}</span>
            {count && maxLength ? (
              <span className="flex-shrink-0">
                {charCount} / {maxLength}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
