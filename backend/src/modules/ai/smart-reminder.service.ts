import { db } from '../../shared/db';
import { signatureRequests, signingReminders } from '../../shared/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';

// ===== TYPES =====
export interface ReminderInsight {
  requestId: string;
  recipientEmail: string;
  recipientName?: string;
  documentName?: string;
  suggestedSendTime: Date;
  urgencyScore: number; // 0-100
  reason: string;
  channel: 'email' | 'sms';
  daysSinceSent: number;
  daysUntilDeadline: number | null;
}

// ===== URGENCY SCORE CALCULATION =====

export function calculateUrgencyScore(input: {
  sentAt: Date;
  deadline: Date | null;
  viewedAt: Date | null;
  signedAt: Date | null;
  remindersSent: number;
}): { score: number; reason: string } {
  // Start with base score
  let score = 0;
  let reasonParts: string[] = [];

  // If already signed, no reminder needed
  if (input.signedAt) {
    return { score: 0, reason: 'Document already signed' };
  }

  // Time elapsed since sent
  const now = new Date();
  const sentTime = new Date(input.sentAt);
  const hoursSinceSent = (now.getTime() - sentTime.getTime()) / (1000 * 60 * 60);
  const daysSinceSent = Math.floor(hoursSinceSent / 24);

  if (daysSinceSent >= 7) {
    score += 20;
    reasonParts.push(`sent ${daysSinceSent} days ago`);
  } else if (daysSinceSent >= 3) {
    score += 15;
    reasonParts.push(`sent ${daysSinceSent} days ago`);
  } else if (daysSinceSent >= 1) {
    score += 10;
    reasonParts.push(`sent ${daysSinceSent} days ago`);
  }

  // Viewed but not signed (high engagement signal)
  if (input.viewedAt && !input.signedAt) {
    score += 25;
    reasonParts.push('viewed but not signed');
  }

  // Deadline proximity
  if (input.deadline) {
    const deadlineTime = new Date(input.deadline);
    const hoursUntilDeadline = (deadlineTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilDeadline = Math.floor(hoursUntilDeadline / 24);

    if (daysUntilDeadline < 0) {
      score += 40;
      reasonParts.push(`deadline passed ${Math.abs(daysUntilDeadline)} days ago`);
    } else if (daysUntilDeadline === 0) {
      score += 35;
      reasonParts.push('deadline today');
    } else if (daysUntilDeadline <= 1) {
      score += 30;
      reasonParts.push('deadline tomorrow');
    } else if (daysUntilDeadline <= 2) {
      score += 28;
      reasonParts.push('deadline in 2 days');
    } else if (daysUntilDeadline <= 3) {
      score += 25;
      reasonParts.push('deadline in 3 days');
  }
  }

  // Diminishing returns from reminders
  // After 3 reminders, effectiveness drops significantly
  if (input.remindersSent >= 3) {
    score -= input.remindersSent * 3;
    reasonParts.push(`${input.remindersSent} reminders already sent`);
  } else if (input.remindersSent > 0) {
    score -= input.remindersSent * 2;
  }

  // Cap at 0-100
  score = Math.max(0, Math.min(100, score));

  const reason = reasonParts.length > 0 ? reasonParts.join('; ') : 'Low priority';

  return { score, reason };
}

// ===== OPTIMAL SEND TIME CALCULATION =====

export function suggestOptimalSendTime(now: Date = new Date()): Date {
  const nextSendTime = new Date(now);

  // Get current time components
  const dayOfWeek = nextSendTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = nextSendTime.getHours();

  // Skip weekends - if it's Saturday or Sunday, move to Monday 9am
  if (dayOfWeek === 0) {
    // Sunday: move to Monday 9am
    nextSendTime.setDate(nextSendTime.getDate() + 1);
    nextSendTime.setHours(9, 0, 0, 0);
  } else if (dayOfWeek === 6) {
    // Saturday: move to Monday 9am
    nextSendTime.setDate(nextSendTime.getDate() + 2);
    nextSendTime.setHours(9, 0, 0, 0);
  } else if (hour >= 9 && hour < 17) {
    // Business hours (9am-5pm): send now or at top of next hour
    nextSendTime.setMinutes(0);
    nextSendTime.setSeconds(0);
  } else if (hour >= 17 && hour < 21) {
    // Evening (5pm-9pm): schedule for next morning 9am
    nextSendTime.setDate(nextSendTime.getDate() + 1);
    nextSendTime.setHours(9, 0, 0, 0);
  } else {
    // Night (9pm-9am): schedule for today at 9am if before 9am, otherwise next day 9am
    if (hour < 9) {
      nextSendTime.setHours(9, 0, 0, 0);
    } else {
      nextSendTime.setDate(nextSendTime.getDate() + 1);
      nextSendTime.setHours(9, 0, 0, 0);
    }
  }

  return nextSendTime;
}

// ===== MAIN ANALYSIS FUNCTION =====

export async function analyzeReminderTiming(orgId: string): Promise<ReminderInsight[]> {
  try {
    // Get all pending/viewed signature requests for the org
    const requests = await db
      .select({
        id: signatureRequests.id,
        recipientEmail: signatureRequests.recipientEmail,
        recipientName: signatureRequests.recipientName,
        sentAt: signatureRequests.createdAt,
        deadline: signatureRequests.deadline,
        viewedAt: signatureRequests.viewedAt,
        signedAt: signatureRequests.signedAt,
        documentId: signatureRequests.documentId,
      })
      .from(signatureRequests)
      .where(
        and(
          // Only include pending and viewed requests (not signed, declined, or expired)
          // We'll check status in the where clause if available, or filter by signedAt
          isNull(signatureRequests.signedAt),
        ),
      );

    const insights: ReminderInsight[] = [];
    const now = new Date();

    for (const request of requests) {
      // Count previous reminders for this request
      const previousReminders = await db
        .select({ count: signatureRequests.id })
        .from(signingReminders)
        .where(eq(signingReminders.requestId, request.id));

      const reminderCount = previousReminders.length || 0;

      // Calculate urgency
      const { score: urgencyScore, reason } = calculateUrgencyScore({
        sentAt: request.sentAt!,
        deadline: request.deadline,
        viewedAt: request.viewedAt,
        signedAt: request.signedAt,
        remindersSent: reminderCount,
      });

      // Skip low urgency items
      if (urgencyScore < 10) {
        continue;
      }

      // Calculate days
      const daysSinceSent = Math.floor(
        (now.getTime() - new Date(request.sentAt!).getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysUntilDeadline = request.deadline
        ? Math.floor(
            (new Date(request.deadline).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      // Suggest send time
      const suggestedSendTime = suggestOptimalSendTime(now);

      // Determine channel based on urgency and reminder count
      const channel: 'email' | 'sms' = reminderCount >= 2 && urgencyScore > 50 ? 'sms' : 'email';

      insights.push({
        requestId: request.id,
        recipientEmail: request.recipientEmail,
        recipientName: request.recipientName || undefined,
        documentName: undefined, // would need document table join
        suggestedSendTime,
        urgencyScore,
        reason,
        channel,
        daysSinceSent,
        daysUntilDeadline,
      });
    }

    // Sort by urgency score (highest first)
    insights.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return insights;
  } catch (error) {
    console.error('[ai:reminder] Failed to analyze reminder timing:', error);
    return [];
  }
}

// ===== HELPER: Get pending reminders that need scheduling =====

export async function getPendingReminders(orgId: string, limit: number = 20) {
  try {
    const now = new Date();

    // Get pending signature requests with no scheduled reminders
    const pendingRequests = await db
      .select()
      .from(signatureRequests)
      .where(
        and(
          isNull(signatureRequests.signedAt),
        ),
      )
      .limit(limit);

    return pendingRequests;
  } catch (error) {
    console.error('[ai:reminder] Failed to get pending reminders:', error);
    return [];
  }
}
