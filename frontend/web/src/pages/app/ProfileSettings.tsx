import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppShell, PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Checkbox,
  InlineNotice,
} from '@/components/ui';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid URL').optional(),
  profileImage: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
});

const creatorSettingsSchema = z.object({
  displayName: z.string().min(2),
  creatorBio: z.string().max(500).optional(),
  categories: z.array(z.string()).min(1),
  defaultSessionPrice: z.coerce.number().min(0),
  bankAccount: z.string().optional(),
  taxId: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
});

const notificationSchema = z.object({
  liveReminders: z.boolean(),
  purchaseUpdates: z.boolean(),
  creatorAnnouncements: z.boolean(),
  systemAlerts: z.boolean(),
  sessionReminders: z.boolean(),
  reviewNotifications: z.boolean(),
  emailDigest: z.enum(['daily', 'weekly', 'monthly', 'never']),
  pushNotifications: z.boolean(),
});

const privacySecuritySchema = z.object({
  publicProfile: z.boolean(),
  showEmail: z.boolean(),
  allowMessages: z.boolean(),
  twoFactorAuth: z.boolean(),
  loginAlerts: z.boolean(),
  sessionRoomPrivacy: z.enum(['public', 'private', 'invitation']),
});

export function ProfileSettingsPage() {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const isCreator = session?.user.roles?.includes('creator');
  const isAdmin = session?.user.roles?.includes('admin');
  const isModerator = session?.user.roles?.includes('moderator');

  const handleBack = () => {
    const roleRoute = {
      creator: '/dashboard/creator',
      viewer: '/dashboard/user',
      admin: '/dashboard/admin',
      moderator: '/dashboard/admin',
    };
    const route = roleRoute[session?.activeRole as keyof typeof roleRoute] || '/dashboard/user';
    navigate(route);
  };

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: session?.user.fullName || '',
      email: session?.user.email || '',
      bio: '',
      website: '',
    },
  });

  const creatorForm = useForm<z.infer<typeof creatorSettingsSchema>>({
    resolver: zodResolver(creatorSettingsSchema),
    defaultValues: {
      displayName: '',
      creatorBio: '',
      categories: [],
      defaultSessionPrice: 29.99,
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      liveReminders: true,
      purchaseUpdates: true,
      creatorAnnouncements: true,
      systemAlerts: true,
      sessionReminders: true,
      reviewNotifications: true,
      emailDigest: 'weekly',
      pushNotifications: true,
    },
  });

  const privacyForm = useForm<z.infer<typeof privacySecuritySchema>>({
    resolver: zodResolver(privacySecuritySchema),
    defaultValues: {
      publicProfile: true,
      showEmail: false,
      allowMessages: true,
      twoFactorAuth: false,
      loginAlerts: true,
      sessionRoomPrivacy: 'public',
    },
  });

  const profileMutation = useMutation({
    mutationFn: async () => session,
    onSuccess: (data) => {
      if (data) setSession(data);
    },
  });

  return (
    <PageFrame>
      <AppShell sidebarTitle="Settings" sidebarItems={[
        { label: 'Back to Dashboard', href: isCreator ? '/dashboard/creator' : '/dashboard/user' },
        { label: 'Settings', href: '/settings' },
        { label: 'Notifications', href: '/notifications' },
      ]}>
        <div className="space-y-8">
          {/* Enhanced Header with Back Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <h1 className="text-3xl font-bold text-text">Settings</h1>
              </div>
              <p className="text-muted">Manage your profile, preferences, and account security</p>
            </div>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg border border-stroke/30 bg-surface/50 px-4 py-2 font-medium text-muted transition-all hover:bg-surface hover:text-text"
            >
              ← Back
            </button>
          </div>

          {/* Role Badge */}
          {(isAdmin || isModerator) && (
            <div className={`rounded-lg border-l-4 p-4 ${
              isAdmin 
                ? 'border-accent/30 bg-accent/5' 
                : 'border-warning/30 bg-warning/5'
            }`}>
              <p className="text-sm font-semibold text-text">
                {isAdmin ? '🔐 Admin Access' : '🛡️ Moderation Access'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {isAdmin 
                  ? 'You have full platform administration capabilities'
                  : 'You have community moderation permissions'
                }
              </p>
            </div>
          )}

          {/* Dynamic Tabs Based on Roles */}
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-stroke/30 overflow-x-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                👤 Profile
              </button>
              {isCreator && (
                <button
                  onClick={() => setActiveTab('creator')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'creator'
                      ? 'text-accent border-accent'
                      : 'text-muted border-transparent hover:text-text'
                  }`}
                >
                  🎬 Creator Settings
                </button>
              )}
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                🔔 Notifications
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'privacy'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                🔒 Privacy & Security
              </button>
            </div>

            {activeTab === 'profile' && (
              <ProfileTab form={profileForm} onSubmit={profileMutation.mutate} />
            )}
            {isCreator && activeTab === 'creator' && <CreatorTab form={creatorForm} />}
            {activeTab === 'notifications' && (
              <NotificationsTab form={notificationForm} />
            )}
            {activeTab === 'privacy' && <PrivacyTab form={privacyForm} />}
          </div>
        </div>
      </AppShell>
    </PageFrame>
  );
}

function ProfileTab({ form, onSubmit }: any) {
  return (
    <div className="space-y-6">
      <Card className="space-y-6 p-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center text-4xl">
            👤
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">Profile Picture</p>
            <Button variant="secondary" size="sm">
              Upload Photo
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Your full name"
            {...form.register('fullName')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            {...form.register('email')}
          />
          <Textarea
            label="Bio"
            placeholder="Tell people about yourself"
            {...form.register('bio')}
            maxLength={500}
            count
          />
          <Input
            label="Website"
            placeholder="https://example.com"
            {...form.register('website')}
          />
        </div>

        <div className="space-y-4 border-t border-stroke/30 pt-6">
          <h3 className="text-lg font-semibold text-text">Social Links</h3>
          <Input
            label="Twitter"
            placeholder="@yourhandle"
            {...form.register('socialLinks.twitter')}
          />
          <Input
            label="Instagram"
            placeholder="@yourhandle"
            {...form.register('socialLinks.instagram')}
          />
          <Input
            label="LinkedIn"
            placeholder="linkedin.com/..."
            {...form.register('socialLinks.linkedin')}
          />
          <Input
            label="GitHub"
            placeholder="github.com/..."
            {...form.register('socialLinks.github')}
          />
        </div>

        <Button onClick={() => onSubmit(form.getValues())} className="w-full">
          Save Changes
        </Button>
      </Card>
    </div>
  );
}

function CreatorTab({ form }: any) {
  return (
    <Card className="space-y-6 p-6">
      <InlineNotice
        title="Creator Settings"
        body="Define how your sessions and content appear to the community"
        tone="default"
      />

      <Input
        label="Creator Display Name"
        placeholder="How you want to be known"
        {...form.register('displayName')}
      />

      <Textarea
        label="Creator Bio"
        placeholder="Describe your expertise and style"
        {...form.register('creatorBio')}
        maxLength={500}
      />

      <Select
        label="Expertise Categories"
        placeholder="Select your categories"
        options={[
          { value: 'education', label: 'Education' },
          { value: 'business', label: 'Business' },
          { value: 'fitness', label: 'Fitness' },
          { value: 'wellness', label: 'Wellness' },
          { value: 'trading', label: 'Trading' },
          { value: 'entertainment', label: 'Entertainment' },
        ]}
        {...form.register('categories')}
      />

      <Input
        label="Default Session Price"
        type="number"
        placeholder="29.99"
        {...form.register('defaultSessionPrice')}
      />

      <div className="space-y-4 border-t border-stroke/30 pt-6">
        <h3 className="text-lg font-semibold text-text">Payout Information</h3>
        <Input
          label="Bank Account"
          placeholder="••••••••••"
          {...form.register('bankAccount')}
        />
        <Input
          label="Routing Number"
          placeholder="••••••••"
          {...form.register('bankRoutingNumber')}
        />
        <Input
          label="Tax ID"
          placeholder="••••••••"
          {...form.register('taxId')}
        />
      </div>

      <Button className="w-full">Save Creator Settings</Button>
    </Card>
  );
}

function NotificationsTab({ form }: any) {
  return (
    <div className="space-y-6">
      <Card className="space-y-6 p-6">
        <h3 className="text-lg font-semibold text-text">Email Notifications</h3>
        <div className="space-y-4">
          <Checkbox
            label="Live Reminders"
            description="Get notified about upcoming live sessions from followed creators"
            {...form.register('liveReminders')}
          />
          <Checkbox
            label="Session Reminders"
            description="Reminder before sessions you've joined starts"
            {...form.register('sessionReminders')}
          />
          <Checkbox
            label="Purchase Updates"
            description="Notifications about uploaded content from purchased items"
            {...form.register('purchaseUpdates')}
          />
          <Checkbox
            label="Creator Announcements"
            description="Important messages from creators you follow"
            {...form.register('creatorAnnouncements')}
          />
          <Checkbox
            label="Review Notifications"
            description="When someone reviews your sessions (creators only)"
            {...form.register('reviewNotifications')}
          />
          <Checkbox
            label="System Alerts"
            description="Important security and account updates"
            {...form.register('systemAlerts')}
          />
        </div>

        <div className="border-t border-stroke/30 pt-6">
          <Select
            label="Email Digest"
            placeholder="Select frequency"
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'never', label: 'Never' },
            ]}
            {...form.register('emailDigest')}
          />
        </div>

        <Checkbox
          label="Push Notifications"
          description="Receive push notifications on your devices"
          {...form.register('pushNotifications')}
        />

        <Button className="w-full">Save Notification Settings</Button>
      </Card>
    </div>
  );
}

function PrivacyTab({ form }: any) {
  return (
    <div className="space-y-6">
      <Card className="space-y-6 p-6">
        <h3 className="text-lg font-semibold text-text">Privacy Settings</h3>

        <div className="space-y-4">
          <Checkbox
            label="Public Profile"
            description="Allow others to view your profile and sessions"
            {...form.register('publicProfile')}
          />
          <Checkbox
            label="Show Email Address"
            description="Display your email on your profile"
            {...form.register('showEmail')}
          />
          <Checkbox
            label="Allow Messages"
            description="Let others send you direct messages"
            {...form.register('allowMessages')}
          />
        </div>

        <div className="border-t border-stroke/30 pt-6">
          <h3 className="text-lg font-semibold text-text mb-4">Session Privacy</h3>
          <Select
            label="Room Privacy"
            placeholder="Select privacy level"
            options={[
              { value: 'public', label: 'Public - Anyone can join' },
              { value: 'private', label: 'Private - Only invited members' },
              { value: 'invitation', label: 'By Invitation - Must request access' },
            ]}
            {...form.register('sessionRoomPrivacy')}
          />
        </div>

        <div className="border-t border-stroke/30 pt-6">
          <h3 className="text-lg font-semibold text-text mb-4">Security</h3>
          <div className="space-y-4">
            <Checkbox
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              {...form.register('twoFactorAuth')}
            />
            <Checkbox
              label="Login Alerts"
              description="Get notified of logins from new devices"
              {...form.register('loginAlerts')}
            />
          </div>
        </div>

        <Button className="w-full">Save Privacy Settings</Button>
      </Card>

      <Card className="space-y-4 p-6 border-danger/30">
        <h3 className="text-lg font-semibold text-danger">Danger Zone</h3>
        <p className="text-sm text-muted">
          These actions cannot be undone. Please proceed with caution.
        </p>
        <Button variant="danger" className="w-full">
          Delete Account
        </Button>
      </Card>
    </div>
  );
}
