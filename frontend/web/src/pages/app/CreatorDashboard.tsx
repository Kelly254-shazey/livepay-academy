import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import {
  Button,
  Card,
  Badge,
  LoadingBlock,
  EmptyState,
} from '@/components/ui';

// Mock data for demo
const mockStats = {
  totalRevenue: 125000,
  monthlyRevenue: 45000,
  activeSessions: 3,
  totalFollowers: 1247,
  averageRating: 4.8,
  ratingCount: 156,
};

const mockRecentActivity = [
  { id: '1', type: 'session', title: 'Advanced Trading Strategies', amount: 75000, time: '2 hours ago' },
  { id: '2', type: 'content', title: 'Market Analysis Report', amount: 45000, time: '5 hours ago' },
  { id: '3', type: 'payout', title: 'Bank Transfer', amount: -200000, time: '1 day ago' },
];

function StatCard({ title, value, subtitle, trend }: {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card className="p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-text">{value}</p>
          {trend && (
            <span className={`text-sm ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend === 'up' ? '↗' : '↘'}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">{subtitle}</p>
      </div>
    </Card>
  );
}

function ActivityItem({ item }: { item: typeof mockRecentActivity[0] }) {
  const isPositive = item.amount > 0;
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-surface-muted rounded-lg flex items-center justify-center">
          <span className="text-sm">
            {item.type === 'session' ? '🔴' : item.type === 'content' ? '📄' : '💸'}
          </span>
        </div>
        <div>
          <p className="font-medium text-text">{item.title}</p>
          <p className="text-sm text-text-muted">{item.time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${
          isPositive ? 'text-success' : 'text-text-muted'
        }`}>
          {isPositive ? '+' : ''}${(item.amount / 1000).toFixed(0)}k
        </p>
      </div>
    </div>
  );
}

export function CreatorDashboardPage() {
  const session = useSessionStore((state) => state.session);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-success/15 via-surface to-surface/80 p-8 md:p-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-success/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <div className="flex items-end gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold text-text leading-tight">
                  Welcome back, {session?.user?.fullName?.split(' ')[0] || 'Creator'}!
                </h1>
                <span className="text-4xl md:text-5xl">🎬</span>
              </div>
              <p className="text-lg text-muted max-w-2xl">
                Manage your live sessions, create premium content, and track your earnings from one powerful studio.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/creator/sessions/new">
                <Button className="flex items-center gap-2">
                  <span>🔴</span> Start Live Session
                </Button>
              </Link>
              <Link to="/creator/content/new">
                <Button variant="secondary" className="flex items-center gap-2">
                  <span>📄</span> Upload Content
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics - Professional Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-text">Performance at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon="💰"
              title="Monthly Revenue"
              value={`$${(mockStats.monthlyRevenue / 1000).toFixed(0)}k`}
              trend="up"
              subtitle="+12% from last month"
            />
            <MetricCard
              icon="🔴"
              title="Active Sessions"
              value={mockStats.activeSessions.toString()}
              subtitle="Currently live"
            />
            <MetricCard
              icon="👥"
              title="Total Followers"
              value={mockStats.totalFollowers.toLocaleString()}
              trend="up"
              subtitle="+47 this week"
            />
            <MetricCard
              icon="⭐"
              title="Creator Rating"
              value={`${mockStats.averageRating}`}
              subtitle={`${mockStats.ratingCount} reviews`}
            />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section Header */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-text">Studio Dashboard</h2>
            <p className="text-muted max-w-2xl">
              Manage your content, track performance, and grow your creator business.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 border-b border-stroke/30 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'sessions', label: 'Live Sessions', icon: '🔴' },
              { id: 'content', label: 'Content', icon: '📄' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent text-text'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                  <Card className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-text">Recent Activity</h3>
                      <p className="text-sm text-muted">Your latest earnings and transactions</p>
                    </div>
                    <div className="space-y-3">
                      {mockRecentActivity.map((item) => (
                        <ActivityItem key={item.id} item={item} />
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full justify-center border-t border-stroke/30 pt-4">
                      View All Transactions →
                    </Button>
                  </Card>
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                  <Card className="space-y-4">
                    <h3 className="text-lg font-bold text-text">Quick Actions</h3>
                    <div className="space-y-2">
                      <QuickActionButton icon="🔴" label="Start Live Session" href="/creator/sessions/new" />
                      <QuickActionButton icon="🎓" label="Create Class" href="/creator/classes/new" />
                      <QuickActionButton icon="📄" label="Upload Content" href="/creator/content/new" />
                      <QuickActionButton icon="👤" label="Edit Profile" href="/creator/profile" />
                      <QuickActionButton icon="💰" label="Payout Settings" href="/creator/payouts" />
                    </div>
                  </Card>

                  {/* Earnings Summary */}
                  <Card className="space-y-4 border-success/30 bg-success/5">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-text">Earnings This Month</h3>
                      <p className="text-3xl font-bold text-success">${(mockStats.monthlyRevenue / 1000).toFixed(1)}k</p>
                      <p className="text-sm text-muted">+12% compared to last month</p>
                    </div>
                    <div className="pt-4 border-t border-success/30">
                      <Button variant="ghost" className="w-full justify-start text-success">
                        💸 View Payout Details
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <Card className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="text-5xl">🔴</div>
                  <h3 className="text-xl font-bold text-text">No live sessions yet</h3>
                  <p className="text-muted">Create your first paid live session to start earning</p>
                  <Link to="/creator/sessions/new">
                    <Button className="mt-4">
                      <span>🔴</span> Create Live Session
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {activeTab === 'content' && (
              <Card className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="text-5xl">📄</div>
                  <h3 className="text-xl font-bold text-text">No content uploaded</h3>
                  <p className="text-muted">Upload premium content to monetize your expertise</p>
                  <Link to="/creator/content/new">
                    <Button className="mt-4">
                      <span>📄</span> Upload Content
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Card className="p-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-text">Performance Analytics</h3>
                  <div className="h-80 rounded-lg bg-gradient-to-br from-surface-muted to-surface flex items-center justify-center text-muted border border-stroke/30">
                    <div className="text-center">
                      <div className="text-5xl mb-3">📈</div>
                      <p>Analytics dashboard coming soon</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper Components
function MetricCard({ icon, title, value, trend, subtitle }: {
  icon: string;
  title: string;
  value: string;
  trend?: 'up' | 'down';
  subtitle: string;
}) {
  return (
    <Card className="relative overflow-hidden p-6 border-accent/20 hover:border-accent/50 transition group">
      <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{icon}</span>
          {trend && (
            <span className={`text-sm font-semibold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend === 'up' ? '↗ +12%' : '↘ -5%'}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted font-medium">{title}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickActionButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link to={href} className="block">
      <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2.5">
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </Button>
    </Link>
  );
}
