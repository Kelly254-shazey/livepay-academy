import type { UserRole } from './contracts';

export interface AssistantSuggestion {
  id: string;
  title: string;
  prompt: string;
}

export const assistantSuggestions: AssistantSuggestion[] = [
  {
    id: 'grow',
    title: 'Grow on LiveGate',
    prompt: 'How should I start as a creator on LiveGate?',
  },
  {
    id: 'hybrid',
    title: 'Use both roles',
    prompt: 'How do hybrid viewer and creator accounts work?',
  },
  {
    id: 'commission',
    title: 'Platform commission',
    prompt: 'Explain the 80/20 commission model.',
  },
  {
    id: 'staff',
    title: 'Staff access',
    prompt: 'How do moderators and admins sign in?',
  },
];

export function generateAssistantReply(
  message: string,
  context?: {
    role?: UserRole | null;
    platform?: 'web' | 'mobile';
  },
) {
  const prompt = message.trim().toLowerCase();
  const roleLabel = context?.role ? `Your active role is ${context.role}. ` : '';
  const platformLabel =
    context?.platform === 'mobile'
      ? 'On mobile, keep high-frequency tasks close to the tabs and put deeper workflows one layer down. '
      : context?.platform === 'web'
        ? 'On web, keep discovery wide, calm, and scan-friendly while dashboards stay operational and dense. '
        : '';

  if (prompt.includes('creator') && prompt.includes('start')) {
    return (
      `${platformLabel}${roleLabel}` +
      'Start with one paid live session, one premium content piece, and one flagship class. Keep pricing simple, use one core category, and make the first screen answer what the creator teaches, how they monetize, and why they are trusted.'
    );
  }

  if (prompt.includes('hybrid') || (prompt.includes('viewer') && prompt.includes('creator'))) {
    return (
      `${roleLabel}` +
      'Hybrid accounts can hold both viewer and creator permissions in one identity. The clean UX is to let the same account switch active role without forcing sign-out, while still allowing separate emails for people who want strict separation.'
    );
  }

  if (prompt.includes('commission') || prompt.includes('80/20')) {
    return 'LiveGate keeps a 20% platform commission on successful purchases and creators keep 80%. The UI should show this clearly in pricing, checkout summaries, creator earnings views, and payout education.';
  }

  if (prompt.includes('admin') || prompt.includes('moderator') || prompt.includes('staff')) {
    return (
      `${platformLabel}` +
      'Staff accounts should use a separate access route that is not promoted in public onboarding. After sign-in, route them directly into oversight surfaces with moderation, audit, and platform health context instead of consumer discovery flows.'
    );
  }

  if (prompt.includes('dashboard')) {
    return (
      `${roleLabel}` +
      'Dashboards should be role-specific. Viewer dashboards emphasize purchases, access, and follows. Creator dashboards emphasize lives, revenue, payouts, and conversion. Staff dashboards emphasize risk, approvals, and platform metrics.'
    );
  }

  return (
    `${platformLabel}${roleLabel}` +
    'Keep the interface intentional: strong category discovery, clean monetization cues, clear role switching, and one assistant surface that helps users act instead of overwhelming them.'
  );
}
