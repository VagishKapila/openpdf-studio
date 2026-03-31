import { db } from '../../shared/db';
import { feedback } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';

export interface TriageResult {
  category: 'bug' | 'feature_request' | 'security' | 'performance' | 'ux' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiSummary: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  suggestedAction?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  bug: [
    'bug', 'error', 'crash', 'broken', 'not working', 'fails', 'issue', 'problem', 'wrong', 'fix', 'glitch',
    '500', '404', 'exception', 'undefined', 'error:', 'failure', 'doesn\'t work', 'failed to', 'unable to',
    'can\'t', 'couldn\'t', 'won\'t', 'stuck', 'freeze', 'hang', 'blank screen', 'white screen'
  ],
  feature_request: [
    'feature', 'would be nice', 'please add', 'suggestion', 'request', 'wish', 'could you', 'want', 'need',
    'missing', 'improve', 'enhancement', 'support for', 'ability to', 'capability', 'add support', 'implement',
    'would love', 'great if', 'one day', 'future', 'roadmap'
  ],
  security: [
    'security', 'vulnerability', 'hack', 'breach', 'password', 'leak', 'exposed', 'unsafe', 'injection',
    'xss', 'csrf', 'unauthorized', 'permission', 'vulnerable', 'attack', 'threat', 'malicious', 'exploit',
    'data loss', 'compromise', 'stolen', 'risk'
  ],
  performance: [
    'slow', 'loading', 'timeout', 'lag', 'memory', 'cpu', 'hang', 'freeze', 'performance', 'sluggish',
    'latency', 'delay', 'response time', 'speed', 'optimize', 'bloated', 'heavy', 'consumption'
  ],
  ux: [
    'confusing', 'hard to', 'unclear', 'design', 'layout', 'navigation', 'ui', 'ux', 'interface',
    'button', 'color', 'font', 'readability', 'usability', 'intuitive', 'clunky', 'ugly', 'pretty',
    'flow', 'workflow', 'experience', 'not obvious', 'can\'t find', 'where is'
  ],
  general: [
    'question', 'how to', 'help', 'confused', 'understand', 'pricing', 'account', 'support', 'what',
    'where', 'why', 'curious', 'feedback', 'comment', 'note', 'info'
  ],
};

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  critical: [
    'urgent', 'critical', 'emergency', 'asap', 'immediately', 'down', 'outage', 'production',
    'data loss', 'security breach', 'cannot access', 'blocked', 'can\'t sign', 'can\'t submit',
    'broken feature', 'completely broken', 'total failure'
  ],
  high: [
    'important', 'serious', 'major', 'significant', 'affecting many', 'high priority', 'business impact',
    'deadline', 'blocking', 'prevents me', 'can\'t work', 'everyday', 'core feature'
  ],
  low: [
    'minor', 'small', 'cosmetic', 'nice to have', 'when you get a chance', 'low priority', 'not urgent',
    'sometime', 'whenever', 'just a thought', 'not a big deal'
  ],
};

// Domain tags for auto-categorization
const DOMAIN_TAGS = {
  'signing': ['sign', 'signature', 'esign', 'sign document', 'signing', 'signer'],
  'payments': ['payment', 'stripe', 'charge', 'invoice', 'billing', 'subscription', 'paid', 'money'],
  'documents': ['document', 'pdf', 'upload', 'file', 'conversion', 'merge', 'split'],
  'mobile': ['mobile', 'phone', 'ios', 'android', 'app', 'responsive', 'tablet', 'iphone'],
  'browser': ['browser', 'chrome', 'firefox', 'safari', 'edge', 'internet explorer'],
  'export': ['export', 'download', 'save', 'share', 'email', 'send'],
  'auth': ['login', 'password', 'oauth', 'google', 'authentication', 'account', 'email verification'],
  'dashboard': ['dashboard', 'analytics', 'report', 'statistics', 'overview'],
};

// Sentiment analysis
const POSITIVE_INDICATORS = ['great', 'love', 'awesome', 'excellent', 'perfect', 'thanks', 'appreciate', 'helpful', 'easy'];
const NEGATIVE_INDICATORS = ['hate', 'terrible', 'awful', 'useless', 'broken', 'frustrat', 'annoying', 'disappointed', 'angry'];

export function triageFeedback(message: string): TriageResult {
  const lowerMessage = message.toLowerCase();

  // Detect category with weighted scoring
  let detectedCategory: TriageResult['category'] = 'general';
  let maxCategoryScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += keyword.split(' ').length; // longer keywords = higher weight
      }
    }
    if (score > maxCategoryScore) {
      maxCategoryScore = score;
      detectedCategory = category as TriageResult['category'];
    }
  }

  // Detect priority
  let detectedPriority: TriageResult['priority'] = 'medium';

  const criticalMatch = PRIORITY_KEYWORDS.critical.some(kw => lowerMessage.includes(kw));
  if (criticalMatch) {
    detectedPriority = 'critical';
  } else if (PRIORITY_KEYWORDS.high.some(kw => lowerMessage.includes(kw))) {
    detectedPriority = 'high';
  } else if (PRIORITY_KEYWORDS.low.some(kw => lowerMessage.includes(kw))) {
    detectedPriority = 'low';
  }

  // Security issues are always high+
  if (detectedCategory === 'security' && ['medium', 'low'].includes(detectedPriority)) {
    detectedPriority = 'high';
  }

  // Detect sentiment
  let sentiment: TriageResult['sentiment'] = 'neutral';
  const positiveCount = POSITIVE_INDICATORS.filter(indicator => lowerMessage.includes(indicator)).length;
  const negativeCount = NEGATIVE_INDICATORS.filter(indicator => lowerMessage.includes(indicator)).length;

  if (negativeCount > positiveCount) {
    sentiment = 'negative';
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
  }

  // Extract domain tags
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(DOMAIN_TAGS)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      tags.push(tag);
    }
  }

  // Determine actionability
  const hasSpecificContext = /page|field|button|error|step|process|flow|workflow/i.test(message);
  const hasReproducibility = /always|every|when i|happens when|steps to reproduce/i.test(message);
  const hasMetrics = /\d+|percentage|amount|count/i.test(message);
  const actionable = hasSpecificContext || hasReproducibility || hasMetrics;

  // Generate summary and suggested action
  const summary = generateSummary(message, detectedCategory, detectedPriority);
  const suggestedAction = actionable ? generateSuggestedAction(message, detectedCategory, sentiment) : undefined;

  return {
    category: detectedCategory,
    priority: detectedPriority,
    aiSummary: summary,
    tags,
    sentiment,
    actionable,
    suggestedAction,
  };
}

function generateSummary(message: string, category: string, priority: string): string {
  const categoryLabels: Record<string, string> = {
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    security: 'Security Report',
    performance: 'Performance Issue',
    ux: 'UX Feedback',
    general: 'General Feedback',
  };

  // Take first sentence or first 100 chars
  const firstSentence = message.split(/[.!?]/)[0]?.trim() || message.substring(0, 100);
  const truncated = firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;

  const priorityLabel = priority === 'critical' ? '[CRITICAL] ' : priority === 'high' ? '[HIGH] ' : '';

  return `${priorityLabel}[${categoryLabels[category] || 'General'}] ${truncated}`;
}

function generateSuggestedAction(message: string, category: string, sentiment: string): string {
  if (category === 'bug') {
    return 'Investigate error logs and test on multiple browsers/devices';
  }
  if (category === 'feature_request') {
    return 'Add to product roadmap; gather similar requests for prioritization';
  }
  if (category === 'security') {
    return 'Escalate to security team immediately for assessment';
  }
  if (category === 'performance') {
    return 'Run performance profiling; analyze bottlenecks in slow area';
  }
  if (category === 'ux') {
    return sentiment === 'negative' ? 'Conduct UX audit and gather more user feedback' : 'Document positive experience and use for case study';
  }
  return 'Follow up with user for clarification and next steps';
}

// Auto-triage and update a feedback entry
export async function autoTriageFeedback(feedbackId: string, message: string) {
  const result = triageFeedback(message);

  try {
    await db
      .update(feedback)
      .set({
        category: result.category,
        priority: result.priority,
        aiSummary: result.aiSummary,
      })
      .where(eq(feedback.id, feedbackId));

    return result;
  } catch (error) {
    console.error('[ai:feedback] Failed to auto-triage:', error);
    return result;
  }
}

// Enhanced triage with all fields
export function triageFeedbackAdvanced(message: string): TriageResult {
  return triageFeedback(message);
}
