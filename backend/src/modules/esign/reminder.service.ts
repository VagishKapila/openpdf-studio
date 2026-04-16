import { db } from '../../shared/db';
import { signingReminders } from '../../shared/db/schema';

/**
 * Reminder service for scheduling automatic signing reminders.
 * Called when a document is sent for signing to set up a schedule of automated reminders.
 */

export interface ScheduleRemindersInput {
  requestId: string;
  recipientEmail: string;
  orgId?: string;
  deadline?: string | Date;
}

/**
 * Schedule automatic reminders when a document is sent for signing.
 * Creates up to 4 reminders:
 * - 1: After 24 hours
 * - 2: After 3 days
 * - 3: After 7 days (escalation)
 * - 4: 1 day before deadline (if deadline is set and within 7 days)
 */
export async function scheduleAutoReminders(input: ScheduleRemindersInput) {
  try {
    const now = new Date();
    const reminders = [];

    // Reminder 1: 24 hours after send
    const reminder1Date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    reminders.push({
      requestId: input.requestId,
      orgId: input.orgId ? (input.orgId as any) : null,
      type: 'auto' as const,
      channel: 'email' as const,
      scheduledAt: reminder1Date,
      recipientEmail: input.recipientEmail,
      message: 'Friendly reminder: You have a document waiting for your signature.',
      attempt: 1,
    });

    // Reminder 2: 3 days after send
    const reminder2Date = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    reminders.push({
      requestId: input.requestId,
      orgId: input.orgId ? (input.orgId as any) : null,
      type: 'auto' as const,
      channel: 'email' as const,
      scheduledAt: reminder2Date,
      recipientEmail: input.recipientEmail,
      message: 'This is a follow-up reminder about a document pending your signature.',
      attempt: 2,
    });

    // Reminder 3: 7 days after send (escalation)
    const reminder3Date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    reminders.push({
      requestId: input.requestId,
      orgId: input.orgId ? (input.orgId as any) : null,
      type: 'escalation' as const,
      channel: 'email' as const,
      scheduledAt: reminder3Date,
      recipientEmail: input.recipientEmail,
      message: 'Urgent: A document requires your immediate attention and signature.',
      attempt: 3,
    });

    // Reminder 4: 1 day before deadline (if deadline is set and in the future)
    if (input.deadline) {
      const deadlineDate = typeof input.deadline === 'string'
        ? new Date(input.deadline)
        : input.deadline;

      const deadlineReminder = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);

      // Only add if it's in the future and not before the existing reminders
      if (deadlineReminder > now && deadlineReminder < reminder3Date) {
        reminders.push({
          requestId: input.requestId,
          orgId: input.orgId ? (input.orgId as any) : null,
          type: 'auto' as const,
          channel: 'email' as const,
          scheduledAt: deadlineReminder,
          recipientEmail: input.recipientEmail,
          message: 'Deadline approaching: Please sign the document before the deadline.',
          attempt: 4,
        });
      }
    }

    // Insert all reminders
    const inserted = await db.insert(signingReminders).values(reminders).returning();
    console.log(`[reminders] Scheduled ${inserted.length} auto-reminders for request ${input.requestId}`);
    return inserted;
  } catch (error) {
    console.error('[reminders] Failed to schedule reminders:', error);
    return null;
  }
}
