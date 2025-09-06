/**
 * Analytics Dashboard
 * Real-time analytics dashboard with user metrics, AI usage, and performance insights
 */

import React, { useState, useEffect } from 'react';
import { analytics } from '../../services/analytics/analytics-service';
import { useAuth } from '../../hooks/useAuth';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface SimpleChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'doughnut';
  height?: number;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, type, height = 200 }) => {
  // Simple chart implementation - in production, use Chart.js or similar
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
  
  if (type === 'line') {
    return (
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 400 200">
          {data.datasets.map((dataset, index) => {
            const points = dataset.data.map((value, i) => ({
              x: (i / (dataset.data.length - 1)) * 380 + 10,
              y: 180 - (value / maxValue) * 160
            }));
            
            const pathData = points.reduce((acc, point, i) => 
              acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`), '');
            
            return (
              <path
                key={index}
                d={pathData}
                stroke={dataset.borderColor || '#3B82F6'}
                strokeWidth="2"
                fill="none"
              />
            );
          })}
        </svg>
      </div>
    );
  }

  if (type === 'bar') {
    const barWidth = 360 / data.labels.length;
    return (
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 400 200">
          {data.datasets[0]?.data.map((value, index) => (
            <rect
              key={index}
              x={20 + index * barWidth}
              y={180 - (value / maxValue) * 160}
              width={barWidth - 10}
              height={(value / maxValue) * 160}
              fill={data.datasets[0].backgroundColor || '#3B82F6'}
              rx="2"
            />
          ))}
        </svg>
      </div>
    );
  }

  return <div className="text-center text-gray-500">Chart not available</div>;
};

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'quarter'>('month');
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const [aiMetrics, setAIMetrics] = useState<any>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, user]);

  useEffect(() => {
    // Set up real-time metrics updates
    const interval = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [userData, aiData] = await Promise.all([
        analytics.getUserAnalytics(user.id, timeframe),
        analytics.getAIAnalytics(timeframe)
      ]);

      setUserMetrics(userData);
      setAIMetrics(aiData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const realTime = await analytics.getRealTimeMetrics();
      setRealTimeMetrics(realTime);
    } catch (err) {
      console.error('Real-time metrics error:', err);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading && !userMetrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userEngagementData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Engagement Score',
      data: [75, 82, 88, 94],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true
    }]
  };

  const aiUsageData: ChartData = {
    labels: ['Assessment', 'Learning', 'Progress', 'Insights', 'Communication'],
    datasets: [{
      label: 'Requests',
      data: [120, 89, 156, 203, 87],
      backgroundColor: '#10B981'
    }]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your relationship growth and AI usage insights</p>
        </div>
        
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
          className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
        </select>
      </div>

      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900">Live Metrics</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 text-sm">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{realTimeMetrics.active_users_now}</p>
              <p className="text-blue-600 text-sm">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{realTimeMetrics.practices_completed_today}</p>
              <p className="text-blue-600 text-sm">Practices Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{realTimeMetrics.system_health_score}%</p>
              <p className="text-blue-600 text-sm">System Health</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{realTimeMetrics.avg_response_time_last_hour}ms</p>
              <p className="text-blue-600 text-sm">Avg Response</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Sessions"
          value={formatNumber(userMetrics?.total_sessions || 0)}
          change={12.5}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <MetricsCard
          title="Avg Session Time"
          value={formatDuration(userMetrics?.avg_session_time_minutes || 0)}
          change={8.3}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricsCard
          title="Practices Completed"
          value={formatNumber(userMetrics?.total_practices_completed || 0)}
          change={15.7}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricsCard
          title="Current Streak"
          value={`${userMetrics?.daily_streak || 0} days`}
          change={userMetrics?.daily_streak > 0 ? 100 : -100}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Trend</h3>
            <span className="text-sm text-gray-500">Last 4 weeks</span>
          </div>
          <SimpleChart data={userEngagementData} type="line" height={200} />
        </div>

        {/* AI Usage Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Agent Usage</h3>
            <span className="text-sm text-gray-500">{timeframe} timeframe</span>
          </div>
          <SimpleChart data={aiUsageData} type="bar" height={200} />
        </div>
      </div>

      {/* AI Metrics Detail */}
      {aiMetrics && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{aiMetrics.summary?.total_requests || 0}</p>
              <p className="text-gray-600">Total AI Requests</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{aiMetrics.summary?.avg_response_time_ms || 0}ms</p>
              <p className="text-gray-600">Avg Response Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">${aiMetrics.summary?.total_cost || 0}</p>
              <p className="text-gray-600">Total Cost</p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Score Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Score Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Session Frequency</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <span className="text-sm text-gray-900">75%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Practice Completion</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '88%'}}></div>
              </div>
              <span className="text-sm text-gray-900">88%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">AI Interaction</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
              <span className="text-sm text-gray-900">92%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
