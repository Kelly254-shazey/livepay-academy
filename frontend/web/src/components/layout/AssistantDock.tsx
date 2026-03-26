import { assistantSuggestions, generateAssistantReply, getActiveRole } from '../../lib/shared';
import { useMemo, useState } from 'react';
import { useSessionStore } from '@/store/session-store';
import { Button, Card, Input } from '@/components/ui';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

const initialMessage: ChatMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  text: 'I am your LiveGate concierge. Ask about role setup, monetization, staff access, demo accounts, or where to find things in the product.',
};

export function AssistantDock() {
  const session = useSessionStore((state) => state.session);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const activeRole = getActiveRole(session);

  const suggestions = useMemo(() => assistantSuggestions.slice(0, 3), []);

  const sendPrompt = (prompt: string) => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    const assistantReply = generateAssistantReply(nextPrompt, {
      role: activeRole,
      platform: 'web',
    });

    setMessages((current) => [
      ...current,
      { id: `user-${current.length + 1}`, role: 'user', text: nextPrompt },
      { id: `assistant-${current.length + 2}`, role: 'assistant', text: assistantReply },
    ]);
    setValue('');
    setOpen(true);
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-1.5rem))] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <Card className="pointer-events-auto w-full space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">AI concierge</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">LiveGate assistant</h3>
            </div>
            <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
              Minimize
            </Button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'assistant'
                    ? 'rounded-[22px] border border-white/30 bg-white/22 p-3 text-sm leading-6 text-muted'
                    : 'ml-auto max-w-[85%] rounded-[22px] bg-accent p-3 text-sm leading-6 text-white shadow-glass'
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-xl transition hover:border-white/50 hover:bg-white/28 hover:text-text"
                onClick={() => sendPrompt(suggestion.prompt)}
                type="button"
              >
                {suggestion.title}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ask about roles, dashboards, payouts, or demo mode"
              value={value}
            />
            <Button fullWidth onClick={() => sendPrompt(value)}>
              Ask assistant
            </Button>
          </div>
        </Card>
      ) : null}

      <Button
        className="pointer-events-auto shadow-glass-lg"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Hide assistant' : 'Open AI concierge'}
      </Button>
    </div>
  );
}
