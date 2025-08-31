import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import {
  TrendingUp, TrendingDown, Users, Brain, Target, MessageSquare,
  Clock, DollarSign, AlertTriangle, CheckCircle, Activity,
  RefreshCw, Download, Filter, Calendar, BarChart3
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import { engagementTracker } from '../../lib/experiments/engagement-tracking';
import { formatNumber, formatCurrency, formatPercentage, formatDuration } from '../../utils/formatting';

interface AnalyticsDashboardProps {
  className?: string;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  muted: '#6b7280'
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Query hooks for different analytics data
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview', dateRange],
    queryFn: () => analyticsService.getOverviewMetrics(dateRange),
    refetchInterval: autoRefresh ? 60000 : false // 1 minute auto-refresh
  });

  const { data: userEngagement } = useQuery({
    queryKey: ['user-engagement', dateRange],
    queryFn: () => analyticsService.getUserEngagementMetrics(dateRange)
  });

  const { data: aiPerformance } = useQuery({
    queryKey: ['ai-performance', dateRange],
    queryFn: () => analyticsService.getAIPerformanceMetrics(dateRange)
  });

  const { data: assessmentMetrics } = useQuery({
    queryKey: ['assessment-metrics', dateRange],
    queryFn: () => analyticsService.getAssessmentMetrics(dateRange)
  });

  const { data: relationshipProgress } = useQuery({
    queryKey: ['relationship-progress', dateRange],
    queryFn: () => analyticsService.getRelationshipProgressMetrics(dateRange)
  });

  const { data: businessMetrics } = useQuery({
    queryKey: ['business-metrics', dateRange],
    queryFn: () => analyticsService.getBusinessMetrics(dateRange)
  });

  const { data: realtimeStats } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: () => analyticsService.getRealtimeStats(),
    refetchInterval: 30000 // 30 seconds
  });

  // Auto-refresh handler
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
        refetchOverview();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchOverview]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const data = await analyticsService.exportAnalytics({
        dateRange,
        format,
        metrics: ['overview', 'engagement', 'ai-performance', 'assessments']
      });
      
      // Create download
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kasama-analytics-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-96 space-x-4">
        <RefreshCw className="animate-spin w-8 h-8 text-primary" />
        <span className="text-lg text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-8 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into user engagement, AI performance, and relationship development progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {autoRefresh ? 'Live' : 'Static'}
          </Button>
          
          {/* Export button */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Realtime Stats Bar */}
      {realtimeStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{realtimeStats.activeUsers}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Interactions</p>
                  <p className="text-2xl font-bold text-foreground">{realtimeStats.aiInteractions}</p>
                </div>
                <Brain className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold text-foreground">{realtimeStats.avgResponseTime}ms</p>
                </div>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Health</p>
                  <p className="text-2xl font-bold text-green-600">{realtimeStats.healthScore}%</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert Panel */}
      {overview?.alerts && overview.alerts.length > 0 && (
        <div className="space-y-2">
          {overview.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Performance
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Business
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewMetrics overview={overview} />
        </TabsContent>

        {/* User Engagement Tab */}
        <TabsContent value="users" className="space-y-6">
          <UserEngagementMetrics data={userEngagement} />
        </TabsContent>

        {/* AI Performance Tab */}
        <TabsContent value="ai" className="space-y-6">
          <AIPerformanceMetrics data={aiPerformance} />
        </TabsContent>

        {/* Assessment Metrics Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <AssessmentMetrics data={assessmentMetrics} />
        </TabsContent>

        {/* Relationship Progress Tab */}
        <TabsContent value="relationships" className="space-y-6">
          <RelationshipMetrics data={relationshipProgress} />
        </TabsContent>

        {/* Business Metrics Tab */}
        <TabsContent value="business" className="space-y-6">
          <BusinessMetrics data={businessMetrics} />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
        <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        <span>Data retention: 90 days | Updates every {autoRefresh ? '60s' : 'manual'}</span>
      </div>
    </div>
  );
};

// Overview Metrics Component
const OverviewMetrics: React.FC<{ overview: any }> = ({ overview }) => {
  if (!overview) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={formatNumber(overview.totalUsers)}
          change={overview.userGrowth}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Active Sessions"
          value={formatNumber(overview.activeSessions)}
          change={overview.sessionGrowth}
          icon={Activity}
          trend={overview.sessionGrowth > 0 ? "up" : "down"}
        />
        <MetricCard
          title="AI Interactions"
          value={formatNumber(overview.aiInteractions)}
          change={overview.aiInteractionGrowth}
          icon={Brain}
          trend={overview.aiInteractionGrowth > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Avg Satisfaction"
          value={`${overview.avgSatisfaction}/5`}
          change={overview.satisfactionChange}
          icon={CheckCircle}
          trend={overview.satisfactionChange > 0 ? "up" : "down"}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>Daily active users and sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overview.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke={COLORS.primary} strokeWidth={2} />
                <Line type="monotone" dataKey="sessions" stroke={COLORS.secondary} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>Most popular platform features</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overview.featureUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overview.featureUsage?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// User Engagement Metrics Component
const UserEngagementMetrics: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>No engagement data available</div>;

  return (
    <div className="space-y-6">
      {/* Engagement KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Session Duration</p>
              <p className="text-2xl font-bold">{formatDuration(data.avgSessionDuration)}</p>
              <Progress value={Math.min(data.avgSessionDuration / 60, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pages/Session</p>
              <p className="text-2xl font-bold">{data.pagesPerSession?.toFixed(1)}</p>
              <Progress value={Math.min(data.pagesPerSession * 20, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
              <p className="text-2xl font-bold">{formatPercentage(data.bounceRate)}</p>
              <Progress value={100 - (data.bounceRate * 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Return Rate</p>
              <p className="text-2xl font-bold">{formatPercentage(data.returnRate)}</p>
              <Progress value={data.returnRate * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Retention (D7)</p>
              <p className="text-2xl font-bold">{formatPercentage(data.retention7d)}</p>
              <Progress value={data.retention7d * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Engagement</CardTitle>
            <CardDescription>Active users and session quality over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyEngagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="activeUsers" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                <Area type="monotone" dataKey="qualitySessions" stackId="2" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Cohorts</CardTitle>
            <CardDescription>Retention by acquisition cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                {data.cohortData?.[0] && Object.keys(data.cohortData[0]).filter(key => key !== 'day').map((cohort, index) => (
                  <Line key={cohort} type="monotone" dataKey={cohort} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// AI Performance Metrics Component
const AIPerformanceMetrics: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>No AI performance data available</div>;

  return (
    <div className="space-y-6">
      {/* AI Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{data.avgResponseTime}ms</p>
                <Badge variant={data.avgResponseTime < 2000 ? 'default' : 'destructive'}>
                  {data.avgResponseTime < 2000 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(data.successRate)}</p>
                <Badge variant={data.successRate > 0.95 ? 'default' : 'secondary'}>
                  {data.successRate > 0.95 ? 'Excellent' : 'Good'}
                </Badge>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Efficiency</p>
                <p className="text-2xl font-bold">{formatCurrency(data.costPerInteraction)}</p>
                <Badge variant={data.costPerInteraction < 0.10 ? 'default' : 'secondary'}>
                  {data.costPerInteraction < 0.10 ? 'Optimized' : 'Monitor'}
                </Badge>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                <p className="text-2xl font-bold">{data.userSatisfaction}/5</p>
                <Badge variant={data.userSatisfaction >= 4 ? 'default' : 'secondary'}>
                  {data.userSatisfaction >= 4 ? 'High' : 'Moderate'}
                </Badge>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Performance</CardTitle>
          <CardDescription>Performance breakdown by AI agent type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.agentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agent" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="responseTime" fill={COLORS.primary} name="Response Time (ms)" />
              <Bar dataKey="satisfaction" fill={COLORS.secondary} name="Satisfaction Score" />
              <Bar dataKey="cost" fill={COLORS.accent} name="Cost per Interaction ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Trends</CardTitle>
            <CardDescription>AI usage costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.costTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Line type="monotone" dataKey="totalCost" stroke={COLORS.accent} strokeWidth={2} />
                <Line type="monotone" dataKey="costPerUser" stroke={COLORS.danger} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
            <CardDescription>Token consumption by agent type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.tokenUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="tokens"
                >
                  {data.tokenUsage?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value), 'Tokens']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Assessment Metrics Component
const AssessmentMetrics: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>No assessment data available</div>;

  return (
    <div className="space-y-6">
      {/* Assessment KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Completion Rate"
          value={formatPercentage(data.completionRate)}
          change={data.completionRateChange}
          icon={Target}
          trend={data.completionRateChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Average Score"
          value={`${data.averageScore}/100`}
          change={data.averageScoreChange}
          icon={CheckCircle}
          trend={data.averageScoreChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Time to Complete"
          value={formatDuration(data.avgCompletionTime)}
          change={data.completionTimeChange}
          icon={Clock}
          trend={data.completionTimeChange < 0 ? "up" : "down"} // Lower is better
        />
        <MetricCard
          title="Retake Rate"
          value={formatPercentage(data.retakeRate)}
          change={data.retakeRateChange}
          icon={RefreshCw}
          trend={data.retakeRateChange < 0 ? "up" : "down"} // Lower is better
        />
      </div>

      {/* Assessment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Types Performance</CardTitle>
            <CardDescription>Completion rates by assessment category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.assessmentTypes} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="type" width={120} />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                <Bar dataKey="completionRate" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Distribution of assessment scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scoreRange" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Insights</CardTitle>
          <CardDescription>Key insights and recommendations for assessment optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Top Performing Areas</h4>
              {data.topAreas?.map((area, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="font-medium">{area.name}</span>
                  <Badge variant="default">{formatPercentage(area.score)}</Badge>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Areas for Improvement</h4>
              {data.improvementAreas?.map((area, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="font-medium">{area.name}</span>
                  <Badge variant="secondary">{formatPercentage(area.score)}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Relationship Metrics Component
const RelationshipMetrics: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>No relationship progress data available</div>;

  return (
    <div className="space-y-6">
      {/* Relationship Progress KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Progress Score"
          value={`${data.avgProgressScore}/100`}
          change={data.progressScoreChange}
          icon={TrendingUp}
          trend={data.progressScoreChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Goal Completion"
          value={formatPercentage(data.goalCompletionRate)}
          change={data.goalCompletionChange}
          icon={Target}
          trend={data.goalCompletionChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Practice Engagement"
          value={formatPercentage(data.practiceEngagement)}
          change={data.practiceEngagementChange}
          icon={Activity}
          trend={data.practiceEngagementChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Milestone Achievements"
          value={data.milestonesAchieved}
          change={data.milestonesChange}
          icon={CheckCircle}
          trend={data.milestonesChange > 0 ? "up" : "down"}
        />
      </div>

      {/* Progress Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Relationship Development Trends</CardTitle>
            <CardDescription>Progress across key relationship dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.developmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="communication" stroke={COLORS.primary} strokeWidth={2} />
                <Line type="monotone" dataKey="empathy" stroke={COLORS.secondary} strokeWidth={2} />
                <Line type="monotone" dataKey="conflict_resolution" stroke={COLORS.accent} strokeWidth={2} />
                <Line type="monotone" dataKey="intimacy" stroke={COLORS.warning} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Practice Category Performance</CardTitle>
            <CardDescription>Engagement rates by practice type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.practiceCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                <Bar dataKey="engagementRate" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Journey Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>User Journey Progress</CardTitle>
          <CardDescription>Progression through relationship development stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.journeyStages?.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{stage.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(stage.usersCompleted)} users ({formatPercentage(stage.completionRate)})
                  </span>
                </div>
                <Progress value={stage.completionRate * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Average time: {formatDuration(stage.avgDuration)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Business Metrics Component
const BusinessMetrics: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>No business metrics data available</div>;

  return (
    <div className="space-y-6">
      {/* Business KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(data.monthlyRevenue)}
          change={data.revenueGrowth}
          icon={DollarSign}
          trend={data.revenueGrowth > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Customer LTV"
          value={formatCurrency(data.customerLTV)}
          change={data.ltvChange}
          icon={Users}
          trend={data.ltvChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Churn Rate"
          value={formatPercentage(data.churnRate)}
          change={data.churnRateChange}
          icon={TrendingDown}
          trend={data.churnRateChange < 0 ? "up" : "down"} // Lower churn is better
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(data.conversionRate)}
          change={data.conversionRateChange}
          icon={Target}
          trend={data.conversionRateChange > 0 ? "up" : "down"}
        />
      </div>

      {/* Revenue and Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly recurring revenue and growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
            <CardDescription>New customers and acquisition channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.acquisitionChannels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="customers" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Health</CardTitle>
            <CardDescription>Key subscription metrics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Active Subscriptions</span>
                <span className="text-2xl font-bold">{formatNumber(data.activeSubscriptions)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Average Contract Value</span>
                <span className="text-2xl font-bold">{formatCurrency(data.averageContractValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Net Revenue Retention</span>
                <span className="text-2xl font-bold">{formatPercentage(data.netRevenueRetention)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Payback Period</span>
                <span className="text-2xl font-bold">{data.paybackPeriod} months</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
            <CardDescription>Key growth indicators and forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Growth Rate (MoM)</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{formatPercentage(data.monthlyGrowthRate)}</span>
                  {data.monthlyGrowthRate > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">CAC Payback</span>
                <span className="text-2xl font-bold">{data.cacPayback} months</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">LTV/CAC Ratio</span>
                <span className="text-2xl font-bold">{data.ltvCacRatio}:1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Runway</span>
                <span className="text-2xl font-bold">{data.runway} months</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Reusable Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, trend, className }) => {
  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDashboard;