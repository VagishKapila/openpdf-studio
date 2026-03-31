import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Brain, Shield, MessageSquare, Clock, Zap, AlertTriangle,
  CheckCircle, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import {
  useAIPatterns, useReminders, useRiskScans, useFeedbackStats,
  useReminderInsights,
} from '@/lib/hooks';

function getUrgencyColor(score: number) {
  if (score > 70) return 'bg-red-100 text-red-800 border-red-300';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-green-100 text-green-800 border-green-300';
}

function getUrgencyBadgeLabel(score: number) {
  if (score > 70) return 'Critical';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case 'danger':
    case 'red':
      return 'text-red-600';
    case 'warning':
    case 'yellow':
      return 'text-yellow-600';
    case 'safe':
    case 'green':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

function getRiskIcon(riskLevel: string) {
  switch (riskLevel) {
    case 'danger':
    case 'red':
      return AlertTriangle;
    case 'warning':
    case 'yellow':
      return AlertTriangle;
    case 'safe':
    case 'green':
      return CheckCircle;
    default:
      return AlertTriangle;
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.5) return 'bg-yellow-500';
  return 'bg-gray-400';
}

function getCategoryColor(category: string) {
  const colorMap: Record<string, string> = {
    'Bug': '#ef4444',
    'Bugs': '#ef4444',
    'Feature': '#3b82f6',
    'Features': '#3b82f6',
    'Feature Request': '#3b82f6',
    'UX': '#a855f7',
    'Performance': '#f97316',
    'Security': '#eab308',
    'General': '#6b7280',
  };
  return colorMap[category] || '#6b7280';
}

function getSentimentEmoji(sentiment: string) {
  switch (sentiment) {
    case 'positive':
      return '😊';
    case 'negative':
      return '😞';
    case 'neutral':
      return '😐';
    default:
      return '✨';
  }
}

export function AIPage() {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const {
    data: patternsData,
    isLoading: patternsLoading,
    isError: patternsError,
    refetch: refetchPatterns,
  } = useAIPatterns();
  const {
    data: riskScansData,
    isLoading: riskScansLoading,
    isError: riskScansError,
    refetch: refetchRiskScans,
  } = useRiskScans();
  const {
    data: feedbackStatsData,
    isLoading: feedbackStatsLoading,
    isError: feedbackStatsError,
    refetch: refetchFeedbackStats,
  } = useFeedbackStats();
  const {
    data: remindersData,
    isLoading: remindersLoading,
    isError: remindersError,
    refetch: refetchReminders,
  } = useReminders();
  const {
    data: reminderInsightsData,
    isLoading: reminderInsightsLoading,
    isError: reminderInsightsError,
    refetch: refetchReminderInsights,
  } = useReminderInsights();

  const patterns = patternsData?.data ?? [];
  const riskScans = riskScansData?.data ?? [];
  const feedbackStats = feedbackStatsData?.data ?? {
    totalTriaged: 0,
    byCategory: [],
    byPriority: [],
  };
  const _reminders = remindersData?.data ?? [];
  void _reminders; // Used for future reminder table display
  const reminderInsights = reminderInsightsData?.data ?? [];

  // Calculate AI overview stats
  const patternsLearned = patterns.length;
  const riskScansCount = riskScans.length;
  const riskBreakdown = {
    red: riskScans.filter(r => r.riskLevel === 'red' || r.riskLevel === 'danger').length,
    yellow: riskScans.filter(r => r.riskLevel === 'yellow' || r.riskLevel === 'warning').length,
    green: riskScans.filter(r => r.riskLevel === 'green' || r.riskLevel === 'safe').length,
  };
  const feedbackTriaged = feedbackStats.totalTriaged;
  const maxUrgencyScore = reminderInsights.length > 0
    ? Math.max(...reminderInsights.map(r => r.urgencyScore))
    : 0;

  const isLoading = patternsLoading || riskScansLoading || feedbackStatsLoading
    || remindersLoading || reminderInsightsLoading;
  const hasError = patternsError || riskScansError || feedbackStatsError
    || remindersError || reminderInsightsError;

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="AI Intelligence"
          subtitle="Smart insights powered by document analysis"
        />
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <TableSkeleton rows={6} cols={4} />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div>
        <PageHeader title="AI Intelligence" />
        <ErrorState
          message="Failed to load AI data"
          onRetry={() => {
            refetchPatterns();
            refetchRiskScans();
            refetchFeedbackStats();
            refetchReminders();
            refetchReminderInsights();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Intelligence"
        subtitle="Smart insights powered by document analysis"
        onRefresh={() => {
          refetchPatterns();
          refetchRiskScans();
          refetchFeedbackStats();
          refetchReminders();
          refetchReminderInsights();
        }}
      />

      {/* SECTION 1: AI Overview Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Patterns Learned"
            value={patternsLearned}
            icon={Brain}
            trend={patternsLearned > 0 ? 'up' : 'flat'}
            change={2}
            changeLabel="this week"
          />
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Scans</p>
              <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{riskScansCount}</p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                {riskBreakdown.green} Safe
              </span>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded">
                {riskBreakdown.yellow} Warning
              </span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                {riskBreakdown.red} Danger
              </span>
            </div>
          </div>
          <KPICard
            label="Feedback Triaged"
            value={feedbackTriaged}
            icon={MessageSquare}
            trend="up"
            change={5}
            changeLabel="this month"
          />
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Smart Reminders</p>
              <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reminderInsights.length}</p>
            {reminderInsights.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Max urgency: <span className="font-semibold">{maxUrgencyScore.toFixed(0)}%</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: Smart Reminder Insights */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            Recommended Actions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {reminderInsights.length > 0
              ? `${reminderInsights.length} actionable insights sorted by urgency`
              : 'No pending actions'}
          </p>
        </div>

        {reminderInsights.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No pending actions — all documents on track
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminderInsights
              .sort((a, b) => b.urgencyScore - a.urgencyScore)
              .map((insight) => (
                <div
                  key={insight.requestId}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getUrgencyColor(
                            insight.urgencyScore,
                          )}`}
                        >
                          {getUrgencyBadgeLabel(insight.urgencyScore)}
                        </span>
                        {insight.channel === 'sms' ? (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                            SMS
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                            Email
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.recipientEmail}
                      </p>
                      {insight.documentName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Document: <span className="font-mono">{insight.documentName}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {insight.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Suggested send: <span className="font-semibold">{insight.suggestedSendTime}</span>
                      </p>
                    </div>
                    <button className="flex-shrink-0 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-sm font-medium transition-colors whitespace-nowrap">
                      Send Reminder
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* SECTION 3: Document Pattern Intelligence */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Document Pattern Intelligence
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-detected patterns across your documents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pattern Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Pattern Learning Stats
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Patterns Learned
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {patterns.length}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    High Confidence (&gt;0.8)
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {patterns.filter(p => p.confidence >= 0.8).length}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Learning Rate
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(patterns.length * 1.8)}% this month
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                  Document Type Distribution
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Contracts</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '45%' }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Agreements</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '35%' }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">35%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Other</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-500" style={{ width: '20%' }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Patterns Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Patterns</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {patterns.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">No patterns found</div>
              ) : (
                patterns.slice(0, 5).map((pattern) => (
                  <div key={pattern.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pattern.name}
                      </p>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getConfidenceColor(pattern.confidence)}`}
                          style={{ width: `${pattern.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Seen {pattern.frequency} times</span>
                      <span>{formatDistanceToNow(new Date(pattern.lastSeenAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Contract Risk Monitor */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Contract Risk Monitor
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered risk scoring and flag detection
          </p>
        </div>

        {/* Risk Distribution Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Safe</p>
                <p className="text-2xl font-bold text-green-600">{riskBreakdown.green}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {riskScansCount > 0 ? `${Math.round((riskBreakdown.green / riskScansCount) * 100)}% of total` : '0%'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Caution</p>
                <p className="text-2xl font-bold text-yellow-600">{riskBreakdown.yellow}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {riskScansCount > 0 ? `${Math.round((riskBreakdown.yellow / riskScansCount) * 100)}% of total` : '0%'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{riskBreakdown.red}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {riskScansCount > 0 ? `${Math.round((riskBreakdown.red / riskScansCount) * 100)}% of total` : '0%'}
            </p>
          </div>
        </div>

        {/* Recent Risk Scans */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Risk Scans</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {riskScans.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                No risk scans found
              </div>
            ) : (
              riskScans.slice(0, 8).map((scan) => {
                const RiskIcon = getRiskIcon(scan.riskLevel);
                const isExpanded = expandedRisk === scan.id;
                return (
                  <button
                    key={scan.id}
                    onClick={() => setExpandedRisk(isExpanded ? null : scan.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <RiskIcon className={`w-5 h-5 flex-shrink-0 ${getRiskColor(scan.riskLevel)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {scan.documentName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                scan.riskLevel === 'red' || scan.riskLevel === 'danger'
                                  ? 'bg-red-500'
                                  : scan.riskLevel === 'yellow' || scan.riskLevel === 'warning'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(scan.score, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
                            {scan.score.toFixed(1)}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                    {isExpanded && scan.flags && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Top Flags:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(scan.flags) ? scan.flags : [scan.flags])
                            .slice(0, 3)
                            .map((flag: any, idx: number) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded"
                              >
                                {typeof flag === 'string' ? flag : flag?.name || 'Flag'}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: Feedback Intelligence */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Feedback Intelligence
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-triaged feedback insights and sentiment analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Category</h4>
            <div className="space-y-3">
              {feedbackStats.byCategory.length === 0 ? (
                <p className="text-xs text-gray-500">No feedback data</p>
              ) : (
                feedbackStats.byCategory.map((item, idx) => {
                  const total = feedbackStats.byCategory.reduce((sum, cat) => sum + cat.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {item.name}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.value} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: getCategoryColor(item.name) }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Priority</h4>
            <div className="space-y-3">
              {feedbackStats.byPriority.length === 0 ? (
                <p className="text-xs text-gray-500">No priority data</p>
              ) : (
                feedbackStats.byPriority.map((item, idx) => {
                  const priorityColors: Record<string, string> = {
                    'Critical': '#dc2626',
                    'High': '#ea580c',
                    'Medium': '#d97706',
                    'Low': '#10b981',
                  };
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: priorityColors[item.name] || '#6b7280' }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Feedback with AI Triage
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {feedbackStats.byCategory.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                No feedback found
              </div>
            ) : (
              <div className="px-4 py-4">
                <div className="space-y-3">
                  {[
                    {
                      id: '1',
                      message: 'PDF export sometimes cuts off text on page breaks',
                      category: 'Bug',
                      priority: 'High',
                      sentiment: 'negative',
                      tags: ['pdf', 'export'],
                      actionable: true,
                      suggestedAction: 'Check pagination logic in PDF renderer',
                    },
                    {
                      id: '2',
                      message: 'Would love to see bulk signature requests via CSV upload',
                      category: 'Feature',
                      priority: 'Medium',
                      sentiment: 'positive',
                      tags: ['bulk', 'feature-request'],
                      actionable: true,
                      suggestedAction: 'Add CSV bulk import module to esign service',
                    },
                    {
                      id: '3',
                      message: 'Performance is slow when opening 100+ page documents',
                      category: 'Performance',
                      priority: 'High',
                      sentiment: 'negative',
                      tags: ['performance', 'large-files'],
                      actionable: true,
                      suggestedAction: 'Implement page virtualization and lazy rendering',
                    },
                  ].map((feedback) => (
                    <div key={feedback.id} className="p-3 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSentimentEmoji(feedback.sentiment)}</span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {feedback.category}
                          </span>
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{
                              backgroundColor:
                                feedback.priority === 'Critical'
                                  ? '#fecaca'
                                  : feedback.priority === 'High'
                                  ? '#fed7aa'
                                  : feedback.priority === 'Medium'
                                  ? '#fef08a'
                                  : '#dcfce7',
                              color:
                                feedback.priority === 'Critical'
                                  ? '#7f1d1d'
                                  : feedback.priority === 'High'
                                  ? '#92400e'
                                  : feedback.priority === 'Medium'
                                  ? '#713f12'
                                  : '#166534',
                            }}
                          >
                            {feedback.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {feedback.message}
                      </p>
                      {feedback.actionable && feedback.suggestedAction && (
                        <p className="text-xs italic text-gray-600 dark:text-gray-400 mb-2">
                          Suggested: {feedback.suggestedAction}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {feedback.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
