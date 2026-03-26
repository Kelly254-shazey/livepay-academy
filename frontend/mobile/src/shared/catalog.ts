export type CategorySlug =
  | 'education'
  | 'trading-education'
  | 'business-entrepreneurship'
  | 'career-coaching'
  | 'mentorship'
  | 'fitness-wellness'
  | 'creative-skills'
  | 'events-workshops'
  | 'premium-tutorials'
  | 'entertainment-live';

export const categories = [
  {
    slug: 'education',
    title: 'Education',
    shortDescription: 'Structured learning, tutoring, and subject mastery.',
  },
  {
    slug: 'trading-education',
    title: 'Trading Education',
    shortDescription: 'High-signal market teaching, analysis, and guided sessions.',
  },
  {
    slug: 'business-entrepreneurship',
    title: 'Business & Entrepreneurship',
    shortDescription: 'Operators, founders, and mentors building revenue skills.',
  },
  {
    slug: 'career-coaching',
    title: 'Career Coaching',
    shortDescription: 'Interview prep, positioning, growth, and leadership support.',
  },
  {
    slug: 'mentorship',
    title: 'Mentorship',
    shortDescription: 'Paid access to personal guidance and long-term expertise.',
  },
  {
    slug: 'fitness-wellness',
    title: 'Fitness & Wellness',
    shortDescription: 'Live classes, routines, and premium wellbeing programs.',
  },
  {
    slug: 'creative-skills',
    title: 'Creative Skills',
    shortDescription: 'Design, music, editing, storytelling, and maker craft.',
  },
  {
    slug: 'events-workshops',
    title: 'Events & Workshops',
    shortDescription: 'Time-bound intensives, launches, cohorts, and expert sessions.',
  },
  {
    slug: 'premium-tutorials',
    title: 'Premium Tutorials',
    shortDescription: 'High-value locked lessons, replays, and downloadable resources.',
  },
  {
    slug: 'entertainment-live',
    title: 'Entertainment Live',
    shortDescription: 'Paid live moments, performances, commentary, and audience access.',
  },
] as const;

export const userRoles = ['viewer', 'creator', 'moderator', 'admin'] as const;
