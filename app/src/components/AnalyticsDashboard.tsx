'use client';

import { useState, useEffect } from 'react';

interface AnalyticsSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  dailyStats: Array<{
    date: string;
    presentations_generated: number;
    presentations_downloaded: number;
    errors_count: number;
  }>;
  topTemplates: Array<{ template: string; count: number }>;
  topThemes: Array<{ theme: string; count: number }>;
}

interface RecentEvent {
  id: string;
  event_type: string;
  event_data: Record<string, any> | null;
  created_at: string;
  user_id?: string;
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'charts'>('overview');

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [summaryRes, eventsRes] = await Promise.all([
          fetch(`/api/analytics?days=${days}`),
          fetch('/api/analytics/events?limit=50'),
        ]);
        
        if (summaryRes.ok) {
          setSummary(await summaryRes.json());
        }
        if (eventsRes.ok) {
          setRecentEvents(await eventsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [days]);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time ago
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Calculate max for chart scaling
  const maxGenerated = Math.max(...(summary?.dailyStats.map(d => d.presentations_generated) || [1]));
  const maxDownloaded = Math.max(...(summary?.dailyStats.map(d => d.presentations_downloaded) || [1]));

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#FEC00F]">Analytics Dashboard</h3>
            <p className="text-xs text-gray-400 mt-0.5">Track usage and performance</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {(['overview', 'events', 'charts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Total Events"
                value={summary?.totalEvents || 0}
                icon="📊"
                color="blue"
              />
              <StatCard
                label="Generated"
                value={summary?.eventsByType['presentation_generated'] || 0}
                icon="📄"
                color="green"
              />
              <StatCard
                label="Downloaded"
                value={summary?.eventsByType['presentation_downloaded'] || 0}
                icon="⬇️"
                color="yellow"
              />
              <StatCard
                label="Errors"
                value={summary?.eventsByType['error'] || 0}
                icon="❌"
                color="red"
              />
            </div>

            {/* Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* Top Templates */}
              <div className="bg-[#0a0a0a] rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">Top Templates</h4>
                {summary?.topTemplates.length ? (
                  <div className="space-y-2">
                    {summary.topTemplates.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-white truncate">{t.template}</span>
                        <span className="text-xs text-gray-400">{t.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No template usage yet</p>
                )}
              </div>

              {/* Top Themes */}
              <div className="bg-[#0a0a0a] rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">Top Themes</h4>
                {summary?.topThemes.length ? (
                  <div className="space-y-2">
                    {summary.topThemes.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-white truncate">{t.theme}</span>
                        <span className="text-xs text-gray-400">{t.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No theme usage yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">No events recorded yet</p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#0a0a0a] rounded-lg p-2 flex items-center gap-3"
                >
                  <span className="text-lg">{getEventIcon(event.event_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">
                      {formatEventType(event.event_type)}
                    </p>
                    {event.event_data && (
                      <p className="text-[10px] text-gray-500 truncate">
                        {JSON.stringify(event.event_data).substring(0, 50)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {timeAgo(event.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-4">
            {/* Daily Chart */}
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-4">Daily Activity</h4>
              {summary?.dailyStats.length ? (
                <div className="h-40 flex items-end gap-1">
                  {summary.dailyStats.slice(-14).reverse().map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${formatDate(day.date)}: ${day.presentations_generated} generated`}
                    >
                      <div
                        className="w-full bg-[#FEC00F] rounded-t transition-all hover:bg-yellow-400"
                        style={{
                          height: `${Math.max(4, (day.presentations_generated / maxGenerated) * 100)}%`,
                          minHeight: '4px',
                        }}
                      />
                      {i % 2 === 0 && (
                        <span className="text-[8px] text-gray-500">{formatDate(day.date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm py-8">No data to display</p>
              )}
            </div>

            {/* Events Distribution */}
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-3">Events Distribution</h4>
              {summary?.eventsByType && Object.keys(summary.eventsByType).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(summary.eventsByType).map(([type, count]) => {
                    const percentage = (count / (summary?.totalEvents || 1)) * 100;
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-32 truncate">
                          {formatEventType(type)}
                        </span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FEC00F] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm py-4">No events recorded</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-3 border`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xl font-bold text-white">{value.toLocaleString()}</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{label}</p>
    </div>
  );
}

// Event icons
function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    presentation_generated: '📄',
    presentation_downloaded: '⬇️',
    presentation_exported_pdf: '📕',
    presentation_exported_images: '🖼️',
    template_used: '📋',
    ai_generation: '🤖',
    ai_refinement: '✨',
    asset_uploaded: '📤',
    template_created: '🆕',
    user_login: '👤',
    error: '❌',
  };
  return icons[type] || '📌';
}

// Format event type
function formatEventType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}