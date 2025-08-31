/**
 * Experiment Analysis Dashboard
 * Comprehensive dashboard for experiment management and analysis
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer,
  Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Zap, AlertTriangle, 
  CheckCircle, Clock, DollarSign, Activity, Target
} from 'lucide-react';

interface ExperimentDashboardProps {
  className?: string;
}

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - would come from experiment system
  const experimentStats: StatCard[] = [
    { title: 'Active Experiments', value: 12, change: 2, trend: 'up', icon: Activity, color: 'blue' },
    { title: 'Total Users', value: '24.8K', change: 8.2, trend: 'up', icon: Users, color: 'green' },
    { title: 'Conversion Rate', value: '3.8%', change: 0.3, trend: 'up', icon: Target, color: 'purple' },
    { title: 'AI Cost', value: '$1,247', change: -12, trend: 'down', icon: DollarSign, color: 'orange' }
  ];

  const recentExperiments = [
    {
      id: 'exp_001',
      name: 'AI Agent Response V2',
      status: 'running',
      progress: 85,
      participants: 1240,
      conversionRate: 4.2,
      significantResult: true,
      startDate: '2025-01-15',
      endDate: '2025-01-29'
    },
    {
      id: 'exp_002', 
      name: 'Assessment Flow Redesign',
      status: 'completed',
      progress: 100,
      participants: 890,
      conversionRate: 3.9,
      significantResult: false,
      startDate: '2025-01-08',
      endDate: '2025-01-22'
    },
    {
      id: 'exp_003',
      name: 'Personalized Daily Insights',
      status: 'running',
      progress: 45,
      participants: 456,
      conversionRate: 5.1,
      significantResult: false,
      startDate: '2025-01-20',
      endDate: '2025-02-03'
    }
  ];

  const conversionData = [
    { date: '2025-01-15', control: 3.2, variant: 3.8 },
    { date: '2025-01-16', control: 3.4, variant: 4.1 },
    { date: '2025-01-17', control: 3.1, variant: 4.3 },
    { date: '2025-01-18', control: 3.6, variant: 4.5 },
    { date: '2025-01-19', control: 3.3, variant: 4.2 },
    { date: '2025-01-20', control: 3.5, variant: 4.7 },
    { date: '2025-01-21', control: 3.2, variant: 4.4 }
  ];

  const aiMetricsData = [
    { metric: 'Response Quality', control: 3.8, variant: 4.2 },
    { metric: 'User Satisfaction', control: 3.9, variant: 4.4 },
    { metric: 'Task Completion', control: 72, variant: 78 },
    { metric: 'Engagement Time', control: 245, variant: 289 }
  ];

  const flagStatusData = [
    { name: 'Enabled', value: 8, color: '#10b981' },
    { name: 'Disabled', value: 4, color: '#ef4444' },
    { name: 'Graduated', value: 6, color: '#6366f1' }
  ];

  const StatCardComponent: React.FC<{ stat: StatCard }> = ({ stat }) => (
    <Card className="p-6 border-l-4" style={{ borderLeftColor: `var(--color-${stat.color}-500)` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          <div className="flex items-center mt-2 text-sm">
            {stat.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : stat.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            ) : null}
            <span className={`${
              stat.trend === 'up' ? 'text-green-600' : 
              stat.trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {stat.change > 0 ? '+' : ''}{stat.change}%
            </span>
            <span className="text-muted-foreground ml-1">vs last period</span>
          </div>
        </div>
        <div className={`p-3 rounded-full bg-${stat.color}-100`}>
          <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
        </div>
      </div>
    </Card>
  );

  const ExperimentCard: React.FC<{ experiment: any }> = ({ experiment }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => setSelectedExperiment(experiment.id)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{experiment.name}</h3>
        <div className="flex items-center space-x-2">
          {experiment.significantResult && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            experiment.status === 'running' ? 'bg-green-100 text-green-800' :
            experiment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {experiment.status}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{experiment.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${experiment.progress}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Participants</p>
            <p className="text-sm font-medium">{experiment.participants.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Conversion</p>
            <p className="text-sm font-medium">{experiment.conversionRate}%</p>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>{experiment.startDate}</span>
          <span>{experiment.endDate}</span>
        </div>
      </div>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {experimentStats.map((stat, index) => (
                <StatCardComponent key={index} stat={stat} />
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Conversion Rate Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="control" stroke="#6b7280" strokeWidth={2} name="Control" />
                    <Line type="monotone" dataKey="variant" stroke="#3b82f6" strokeWidth={2} name="Variant" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Feature Flag Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={flagStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {flagStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        );

      case 'experiments':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Experiments</h2>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Experiment
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentExperiments.map((experiment) => (
                <ExperimentCard key={experiment.id} experiment={experiment} />
              ))}
            </div>
          </div>
        );

      case 'ai-analysis':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI Agent Performance</h2>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI Metrics Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={aiMetricsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="metric" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="control" fill="#6b7280" name="Control" />
                    <Bar dataKey="variant" fill="#3b82f6" name="Variant" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Total AI Cost</span>
                    <span className="text-lg font-bold text-green-600">$1,247</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Cost per User</span>
                    <span className="text-lg font-bold">$0.05</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Tokens Used</span>
                    <span className="text-lg font-bold">2.4M</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                    <span className="font-medium text-green-800">Cost Savings</span>
                    <span className="text-lg font-bold text-green-600">-12%</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Satisfaction Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="control" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} name="Control Satisfaction" />
                  <Area type="monotone" dataKey="variant" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Variant Satisfaction" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        );

      case 'feature-flags':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Feature Flags</h2>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Create Flag
              </Button>
            </div>

            <div className="grid gap-4">
              {[
                { name: 'AI Agent V2', enabled: true, rollout: 25, users: '2.1K' },
                { name: 'Premium Features', enabled: true, rollout: 100, users: '890' },
                { name: 'New Dashboard', enabled: false, rollout: 0, users: '0' },
                { name: 'Cost Optimization', enabled: true, rollout: 50, users: '1.2K' }
              ].map((flag, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${flag.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <h3 className="font-medium">{flag.name}</h3>
                        <p className="text-sm text-muted-foreground">{flag.users} active users</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{flag.rollout}%</p>
                        <p className="text-xs text-muted-foreground">rollout</p>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${flag.rollout}%` }}
                        />
                      </div>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Experiment Dashboard</h1>
        <p className="text-gray-600">Monitor and analyze your A/B tests and feature flags</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'experiments', name: 'Experiments', icon: Zap },
            { id: 'ai-analysis', name: 'AI Analysis', icon: Target },
            { id: 'feature-flags', name: 'Feature Flags', icon: CheckCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Create Experiment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Experiment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter experiment name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hypothesis
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe your hypothesis"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>AI Response Test</option>
              <option>UI Component Test</option>
              <option>Feature Test</option>
              <option>Onboarding Flow</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create Experiment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExperimentDashboard;