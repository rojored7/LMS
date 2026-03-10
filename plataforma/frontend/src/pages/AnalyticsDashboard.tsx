/**
 * Analytics Dashboard Page
 * HU-038: Comprehensive analytics with charts and metrics
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../utils/cn';

// Import chart components (we'll use recharts)
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 days'
  });
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Mock data - replace with real API calls
  const metrics: MetricCard[] = [
    {
      title: t('analytics.totalUsers'),
      value: '12,543',
      change: 12.5,
      changeLabel: 'vs last period',
      icon: <Users className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: t('analytics.activeCourses'),
      value: '48',
      change: 8.3,
      changeLabel: 'vs last period',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'green'
    },
    {
      title: t('analytics.completionRate'),
      value: '78.4%',
      change: -2.1,
      changeLabel: 'vs last period',
      icon: <Award className="w-5 h-5" />,
      color: 'yellow'
    },
    {
      title: t('analytics.avgStudyTime'),
      value: '4.2h',
      change: 15.7,
      changeLabel: 'vs last period',
      icon: <Clock className="w-5 h-5" />,
      color: 'purple'
    }
  ];

  // Mock chart data
  const userGrowthData = [
    { month: 'Jan', users: 4000, activeUsers: 2400 },
    { month: 'Feb', users: 4500, activeUsers: 2800 },
    { month: 'Mar', users: 5200, activeUsers: 3200 },
    { month: 'Apr', users: 6100, activeUsers: 3900 },
    { month: 'May', users: 7300, activeUsers: 4600 },
    { month: 'Jun', users: 8700, activeUsers: 5400 },
    { month: 'Jul', users: 10200, activeUsers: 6800 },
    { month: 'Aug', users: 11500, activeUsers: 7900 },
    { month: 'Sep', users: 12543, activeUsers: 8734 }
  ];

  const coursePopularityData = [
    { name: 'Cybersecurity Fundamentals', students: 3421, completion: 82 },
    { name: 'Network Security', students: 2856, completion: 75 },
    { name: 'Ethical Hacking', students: 2234, completion: 68 },
    { name: 'Cloud Security', students: 1987, completion: 71 },
    { name: 'Incident Response', students: 1543, completion: 85 }
  ];

  const engagementData = [
    { day: 'Mon', views: 4000, interactions: 2400, completions: 800 },
    { day: 'Tue', views: 3800, interactions: 2200, completions: 750 },
    { day: 'Wed', views: 4200, interactions: 2600, completions: 900 },
    { day: 'Thu', views: 4500, interactions: 2800, completions: 950 },
    { day: 'Fri', views: 3900, interactions: 2300, completions: 820 },
    { day: 'Sat', views: 2800, interactions: 1800, completions: 600 },
    { day: 'Sun', views: 2600, interactions: 1600, completions: 550 }
  ];

  const skillDistributionData = [
    { skill: 'Security', level: 85 },
    { skill: 'Networking', level: 72 },
    { skill: 'Programming', level: 68 },
    { skill: 'Cloud', level: 75 },
    { skill: 'Compliance', level: 60 },
    { skill: 'Forensics', level: 55 }
  ];

  const deviceUsageData = [
    { name: 'Desktop', value: 45, color: '#3B82F6' },
    { name: 'Mobile', value: 35, color: '#10B981' },
    { name: 'Tablet', value: 20, color: '#F59E0B' }
  ];

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    // Show success toast
  };

  const handleRefresh = () => {
    // Refresh data
  };

  const dateRangeOptions = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title', 'Analytics Dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.subtitle', 'Track performance and insights across your platform')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            onChange={(e) => {
              const days = parseInt(e.target.value);
              setDateRange({
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                end: new Date(),
                label: e.target.options[e.target.selectedIndex].text
              });
            }}
          >
            {dateRangeOptions.map(option => (
              <option key={option.days} value={option.days}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Filter Button */}
          <Button variant="secondary" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            {t('common.filter')}
          </Button>

          {/* Refresh Button */}
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Export Dropdown */}
          <div className="relative group">
            <Button variant="primary" size="sm" disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {t('common.export')}
            </Button>
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 invisible group-hover:visible z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {metric.value}
                </p>
                <div className="flex items-center mt-2">
                  {metric.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      metric.change > 0 ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {Math.abs(metric.change)}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {metric.changeLabel}
                  </span>
                </div>
              </div>
              <div className={cn(
                'p-3 rounded-lg',
                `bg-${metric.color}-100 dark:bg-${metric.color}-900/30`
              )}>
                {metric.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.userGrowth', 'User Growth')}
            </h3>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Course Popularity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.coursePopularity', 'Course Popularity')}
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={coursePopularityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="students" fill="#3B82F6" />
              <Bar dataKey="completion" fill="#10B981" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Card>

        {/* Weekly Engagement */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.weeklyEngagement', 'Weekly Engagement')}
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3B82F6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="interactions"
                stroke="#10B981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#F59E0B"
                strokeWidth={2}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </Card>

        {/* Device Usage Pie Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.deviceUsage', 'Device Usage')}
            </h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={deviceUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Skills Radar Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('analytics.skillsDistribution', 'Skills Distribution')}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={skillDistributionData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="skill" stroke="#9CA3AF" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
            <Radar
              name="Average Level"
              dataKey="level"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Real-time Activity Feed */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('analytics.realtimeActivity', 'Real-time Activity')}
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  User completed "Cybersecurity Fundamentals" module
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2 minutes ago
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;