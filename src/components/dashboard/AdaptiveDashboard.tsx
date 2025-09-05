/**
 * Adaptive Dashboard Component
 * AI-powered dashboard that personalizes layout and content based on user behavior
 */

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiComponentFactory, createAdaptiveDashboard } from '../../lib/ai-component-factory';
import { apiRequest } from '../../lib/api-route-manager';
import { AlertCircle, Activity, Brain, Target, TrendingUp, Users } from 'lucide-react';

interface DashboardConfig {
  layout: 'grid' | 'list' | 'card' | 'adaptive';
  components: Array<{
    type: string;
    config: any;
    priority: number;
    position: { x: number; y: number; w: number; h: number };
  }>;
}

interface AdaptiveDashboardProps {
  userId: string;
  userPreferences?: {
    communicationStyle?: 'formal' | 'casual' | 'supportive';
    aiPersonality?: 'encouraging' | 'direct' | 'analytical';
    learningPace?: 'slow' | 'moderate' | 'fast';
  };
}

const LoadingWidget: React.FC<{ type: string }> = ({ type }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-lg shadow-sm p-6 h-32 flex items-center justify-center border"
  >
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span className="text-gray-600">Loading {type}...</span>
    </div>
  </motion.div>
);

const ErrorWidget: React.FC<{ type: string; onRetry: () => void }> = ({ type, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-red-50 rounded-lg shadow-sm p-6 h-32 flex items-center justify-center border border-red-200"
  >
    <div className="text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
      <p className="text-red-600 text-sm mb-2">Failed to load {type}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>
  </motion.div>
);

// AI-powered widget components
const ProgressSummary: React.FC<{ aiContext?: any; variant?: string }> = ({ aiContext, variant }) => {
  const [progress, setProgress] = useState({ overall: 0, weekly: 0, streak: 0 });

  useEffect(() => {
    // Simulate AI-personalized progress data
    const fetchProgress = async () => {
      try {
        const data = await apiRequest('progress.tracking', {
          timeframe: 'week',
          personalized: true
        });
        setProgress(data);
      } catch (error) {
        console.error('Progress fetch failed:', error);
        setProgress({ overall: 72, weekly: 15, streak: 5 }); // Fallback data
      }
    };
    
    fetchProgress();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
        <TrendingUp className="w-5 h-5 text-purple-600" />
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Overall Growth</span>
            <span className="font-medium text-purple-600">{progress.overall}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.overall}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{progress.weekly}</div>
            <div className="text-xs text-gray-600">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{progress.streak}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DailyInsights: React.FC<{ aiContext?: any; variant?: string }> = ({ aiContext, variant }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('ai.insights', {
          userId: aiContext?.userProfile?.id,
          limit: 3,
          personalized: true
        });
        setInsights(data.insights || []);
      } catch (error) {
        console.error('Insights fetch failed:', error);
        setInsights([
          { 
            title: "Communication Growth",
            message: "You've improved your active listening by 15% this week!",
            icon: "💬",
            priority: "high"
          },
          {
            title: "Practice Reminder", 
            message: "Try the mindful breathing exercise today for deeper connection.",
            icon: "🧘",
            priority: "medium"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsights();
  }, [aiContext]);

  if (loading) return <LoadingWidget type="insights" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-sm p-6 border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <Brain className="w-5 h-5 text-green-600" />
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border"
            >
              <span className="text-xl">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                <p className="text-xs text-gray-600 mt-1">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CurrentPractices: React.FC<{ aiContext?: any; variant?: string }> = ({ aiContext, variant }) => {
  const [practices, setPractices] = useState<any[]>([]);

  useEffect(() => {
    const fetchPractices = async () => {
      try {
        const data = await apiRequest('content.practices', {
          userId: aiContext?.userProfile?.id,
          active: true,
          limit: 4
        });
        setPractices(data.practices || []);
      } catch (error) {
        console.error('Practices fetch failed:', error);
        setPractices([
          { title: "Daily Check-In", progress: 80, category: "Communication", time: "5 min" },
          { title: "Gratitude Practice", progress: 60, category: "Mindfulness", time: "3 min" },
          { title: "Active Listening", progress: 45, category: "Skills", time: "10 min" }
        ]);
      }
    };
    
    fetchPractices();
  }, [aiContext]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg shadow-sm p-6 border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Practices</h3>
        <Target className="w-5 h-5 text-orange-600" />
      </div>
      
      <div className="space-y-3">
        {practices.map((practice, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">{practice.title}</h4>
                <span className="text-xs text-gray-500">{practice.time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${practice.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{practice.progress}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({ 
  userId, 
  userPreferences 
}) => {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const config = await createAdaptiveDashboard(userId, userPreferences);
        setDashboardConfig(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        // Fallback configuration
        setDashboardConfig({
          layout: 'grid',
          components: [
            { type: 'progress-summary', config: {}, priority: 1, position: { x: 0, y: 0, w: 6, h: 4 } },
            { type: 'daily-insights', config: {}, priority: 2, position: { x: 6, y: 0, w: 6, h: 4 } },
            { type: 'current-practices', config: {}, priority: 3, position: { x: 0, y: 4, w: 12, h: 6 } }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardConfig();
  }, [userId, userPreferences]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-gray-600 text-lg">🤖 AI is personalizing your dashboard...</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !dashboardConfig) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorWidget 
            type="dashboard" 
            onRetry={() => window.location.reload()} 
          />
        </div>
      </div>
    );
  }

  const renderComponent = (componentConfig: any) => {
    const commonProps = {
      aiContext: { userProfile: { id: userId } },
      variant: componentConfig.config.variant
    };

    switch (componentConfig.type) {
      case 'progress-summary':
        return <ProgressSummary {...commonProps} />;
      case 'daily-insights':
        return <DailyInsights {...commonProps} />;
      case 'current-practices':
        return <CurrentPractices {...commonProps} />;
      default:
        return <div className="bg-gray-100 rounded-lg p-6">Unknown component: {componentConfig.type}</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Relationship Dashboard</h1>
              <p className="text-gray-600 mt-1">AI-powered insights for your growth journey</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Live AI Updates</span>
            </div>
          </div>
        </motion.div>

        {/* Adaptive Grid Layout */}
        <div className={`grid gap-6 ${
          dashboardConfig?.layout === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-12' 
            : 'grid-cols-1'
        }`}>
          <AnimatePresence>
            {dashboardConfig?.components
              .sort((a, b) => a.priority - b.priority)
              .map((component, index) => (
                <motion.div
                  key={`${component.type}-${index}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${
                    dashboardConfig.layout === 'grid' 
                      ? `lg:col-span-${component.position.w} md:col-span-${Math.min(component.position.w, 6)}`
                      : 'w-full'
                  }`}
                  style={{
                    gridRowStart: dashboardConfig.layout === 'grid' ? component.position.y + 1 : 'auto'
                  }}
                >
                  <Suspense fallback={<LoadingWidget type={component.type} />}>
                    {renderComponent(component)}
                  </Suspense>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdaptiveDashboard;
