import { assistantSuggestions, generateAssistantReply, getActiveRole } from '@livegate/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Heading, Screen, Surface, TextField } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

interface AssistantMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

const initialMessage: AssistantMessage = {
  id: 'assistant-mobile-welcome',
  role: 'assistant',
  text: 'Ask me about LiveGate roles, monetization, dashboards, demo accounts, or where to go next.',
};

export function AssistantScreen() {
  const session = useSessionStore((state) => state.session);
  const activeRole = getActiveRole(session);
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([initialMessage]);

  const sendPrompt = (prompt: string) => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    const reply = generateAssistantReply(nextPrompt, {
      role: activeRole,
      platform: 'mobile',
    });

    setMessages((current) => [
      ...current,
      { id: `mobile-user-${current.length + 1}`, role: 'user', text: nextPrompt },
      { id: `mobile-assistant-${current.length + 2}`, role: 'assistant', text: reply },
    ]);
    setValue('');
  };

  return (
    <Screen>
      <Heading title="LiveGate assistant" />

      <Surface>
        <TextField
          label="Ask something"
          onChangeText={setValue}
          placeholder="How does hybrid mode work?"
          value={value}
        />
        <Button onPress={() => sendPrompt(value)} title="Ask assistant" />
      </Surface>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {assistantSuggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            onPress={() => sendPrompt(suggestion.prompt)}
            title={suggestion.title}
            variant="secondary"
          />
        ))}
      </View>

      <View style={{ gap: 12 }}>
        {messages.map((message) => (
          <Surface
            key={message.id}
            style={{
              backgroundColor:
                message.role === 'assistant'
                  ? 'rgba(255,255,255,0.72)'
                  : '#0D7C74',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                lineHeight: 22,
                color: message.role === 'assistant' ? '#60726C' : '#F8FFFB',
              }}
            >
              {message.text}
            </Text>
          </Surface>
        ))}
      </View>
    </Screen>
  );
}
