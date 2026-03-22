import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppShell, PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Checkbox,
  InlineNotice,
} from '@/components/ui';

const createSessionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Select a category'),
  sessionType: z.enum(['audio', 'video', 'both']),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  maxParticipants: z.coerce.number().min(1, 'At least 1 participant required'),
  startTime: z.string().datetime('Invalid date/time'),
  duration: z.coerce.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours'),
  isRecorded: z.boolean(),
  isPublic: z.boolean(),
  tags: z.string(),
  preSessionInstructions: z.string().optional(),
  materials: z.string().optional(),
  requirements: z.string().optional(),
  refundPolicy: z.enum(['none', 'full', 'partial']),
  enableChat: z.boolean(),
  enableQ_A: z.boolean(),
  allowReplay: z.boolean(),
});

export function CreateLiveSessionPage() {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof createSessionSchema>>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      sessionType: 'both',
      price: 29.99,
      maxParticipants: 100,
      duration: 60,
      isRecorded: true,
      isPublic: true,
      tags: '',
      enableChat: true,
      enableQ_A: true,
      allowReplay: true,
      refundPolicy: 'full',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSessionSchema>) =>
      Promise.resolve({ id: 'session-' + Date.now() }),
    onSuccess: (data: { id: string }) => {
      navigate(`/creator/sessions/${data.id}`);
    },
  });

  const onSubmit = (data: z.infer<typeof createSessionSchema>) => {
    createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0]);
  };

  return (
    <PageFrame>
      <AppShell sidebarTitle="Creator Studio" sidebarItems={[]}>
        <div className="space-y-8 max-w-3xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-text">Create Live Session</h1>
            <p className="mt-1 text-muted">Set up a new paid live session for your audience</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card className="space-y-6 p-6">
              <h2 className="text-xl font-semibold text-text">Basic Information</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Session Title</label>
                <Input
                  placeholder="e.g., Advanced Python Web Development Q&A"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Description</label>
                <Textarea
                  placeholder="What will you cover? What should attendees expect?"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-danger">{form.formState.errors.description.message}</p>
                )}
              </div>

              <Select
                label="Category"
                placeholder="Select category"
                options={[
                  { value: 'education', label: 'Education' },
                  { value: 'business', label: 'Business' },
                  { value: 'trading', label: 'Trading' },
                  { value: 'wellness', label: 'Wellness' },
                  { value: 'fitness', label: 'Fitness' },
                  { value: 'entertainment', label: 'Entertainment' },
                ]}
                {...form.register('category')}
              />
              {form.formState.errors.category && (
                <p className="text-xs text-danger">{form.formState.errors.category.message}</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium block">Tags (comma-separated)</label>
                <Input
                  placeholder="python, web, development, q-and-a"
                  {...form.register('tags')}
                />
              </div>
            </Card>

            {/* Session Details */}
            <Card className="space-y-6 p-6">
              <h2 className="text-xl font-semibold text-text">Session Details</h2>

              <Select
                label="Session Type"
                placeholder="Select type"
                options={[
                  { value: 'audio', label: 'Audio Only' },
                  { value: 'video', label: 'Video Only' },
                  { value: 'both', label: 'Audio + Video' },
                ]}
                {...form.register('sessionType')}
              />
              {form.formState.errors.sessionType && (
                <p className="text-xs text-danger">{form.formState.errors.sessionType.message}</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium block">Start Date & Time</label>
                <Input type="datetime-local" {...form.register('startTime')} />
                {form.formState.errors.startTime && (
                  <p className="text-xs text-danger">{form.formState.errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="60"
                  {...form.register('duration')}
                />
                {form.formState.errors.duration && (
                  <p className="text-xs text-danger">{form.formState.errors.duration.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="29.99"
                  {...form.register('price')}
                />
                {form.formState.errors.price && (
                  <p className="text-xs text-danger">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Max Participants</label>
                <Input
                  type="number"
                  placeholder="100"
                  {...form.register('maxParticipants')}
                />
                {form.formState.errors.maxParticipants && (
                  <p className="text-xs text-danger">{form.formState.errors.maxParticipants.message}</p>
                )}
              </div>
            </Card>

            {/* Features */}
            <Card className="space-y-6 p-6">
              <h2 className="text-xl font-semibold text-text">Features & Options</h2>

              <Checkbox
                label="Record This Session"
                description="Allow participants to watch the replay after it ends"
                {...form.register('isRecorded')}
              />

              <Checkbox
                label="Public Session"
                description="Anyone can discover and join this session"
                {...form.register('isPublic')}
              />

              <Checkbox
                label="Enable Chat"
                description="Let participants chat during the session"
                {...form.register('enableChat')}
              />

              <Checkbox
                label="Enable Q&A"
                description="Participants can ask questions you'll answer live"
                {...form.register('enableQ_A')}
              />

              <Checkbox
                label="Allow Replay"
                description="Participants can watch the recording afterward"
                {...form.register('allowReplay')}
              />

              <Select
                label="Refund Policy"
                placeholder="Select policy"
                options={[
                  { value: 'full', label: 'Full refund if not attended' },
                  { value: 'partial', label: 'Partial refund (50%)' },
                  { value: 'none', label: 'No refunds' },
                ]}
                {...form.register('refundPolicy')}
              />
              {form.formState.errors.refundPolicy && (
                <p className="text-xs text-danger">{form.formState.errors.refundPolicy.message}</p>
              )}
            </Card>

            {/* Additional Info */}
            <Card className="space-y-6 p-6">
              <h2 className="text-xl font-semibold text-text">Additional Information</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Pre-Session Instructions</label>
                <Textarea
                  placeholder="Any setup or preparation needed?"
                  {...form.register('preSessionInstructions')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Materials or Resources</label>
                <Textarea
                  placeholder="Links, downloads, or materials attendees should have"
                  {...form.register('materials')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Requirements</label>
                <Textarea
                  placeholder="Technical requirements, prerequisites, etc."
                  {...form.register('requirements')}
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </div>

            {createMutation.isError && (
              <InlineNotice
                title="Session creation failed"
                body={(createMutation.error as Error).message}
                tone="danger"
              />
            )}
          </form>
        </div>
      </AppShell>
    </PageFrame>
  );
}
