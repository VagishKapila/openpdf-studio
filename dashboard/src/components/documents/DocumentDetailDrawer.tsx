import { useState } from 'react';
import { X, FileText, Download, Eye, Bell, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { DocumentRecord } from '@/types';
import toast from 'react-hot-toast';

interface DocumentDetailDrawerProps {
  document: DocumentRecord | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_CONFIG = {
  draft: { color: '#6b7280', label: 'Draft', bgColor: '#f3f4f6' },
  sent: { color: '#3b82f6', label: 'Sent', bgColor: '#eff6ff' },
  viewed: { color: '#06b6d4', label: 'Viewed', bgColor: '#ecf8ff' },
  signed: { color: '#10b981', label: 'Signed', bgColor: '#ecfdf5' },
  paid: { color: '#f59e0b', label: 'Paid', bgColor: '#fffbeb' },
  completed: { color: '#059669', label: 'Completed', bgColor: '#ecfdf5' },
  archived: { color: '#9ca3af', label: 'Archived', bgColor: '#f9fafb' },
};

export function DocumentDetailDrawer({ document, open, onClose }: DocumentDetailDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!document) return null;

  const statusConfig = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG];
  const recipientEmail = (document.metadata?.recipientEmail as string) || null;
  const recipientName = (document.metadata?.recipientName as string) || null;

  // Build timeline from document status
  const timeline = buildTimeline(document);

  const handleSendReminder = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Reminder sent');
    } catch (err) {
      toast.error('Failed to send reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Simulate download
      toast.success('Document downloaded');
    } catch (err) {
      toast.error('Failed to download');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 z-50 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-out overflow-y-auto ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-brand-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                {document.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statusConfig.color }}
              />
              {statusConfig.label}
            </div>
          </div>

          {/* Document Info */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Document Info
            </h4>
            <div className="space-y-2">
              <InfoRow label="File Type" value={document.type.toUpperCase()} />
              <InfoRow label="File Size" value={formatBytes(document.size)} />
              {document.pageCount && (
                <InfoRow label="Pages" value={`${document.pageCount} page${document.pageCount !== 1 ? 's' : ''}`} />
              )}
              <InfoRow
                label="Created"
                value={format(new Date(document.createdAt), 'MMM d, yyyy h:mm a')}
              />
              <InfoRow
                label="Updated"
                value={format(new Date(document.updatedAt), 'MMM d, yyyy h:mm a')}
              />
            </div>
          </div>

          {/* Recipient Info */}
          {recipientEmail && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Recipient
              </h4>
              <div className="space-y-2">
                {recipientName && (
                  <InfoRow label="Name" value={recipientName} />
                )}
                <InfoRow label="Email" value={recipientEmail} />
                {!!document.metadata?.sentAt && (
                  <InfoRow
                    label="Sent"
                    value={format(new Date(String(document.metadata.sentAt)), 'MMM d, yyyy')}
                  />
                )}
                {!!document.metadata?.viewedAt && (
                  <InfoRow
                    label="Viewed"
                    value={format(new Date(String(document.metadata.viewedAt)), 'MMM d, yyyy')}
                  />
                )}
                {!!document.metadata?.signedAt && (
                  <InfoRow
                    label="Signed"
                    value={format(new Date(String(document.metadata.signedAt)), 'MMM d, yyyy')}
                  />
                )}
                {!!document.metadata?.deadline && (
                  <InfoRow
                    label="Deadline"
                    value={format(new Date(String(document.metadata.deadline)), 'MMM d, yyyy')}
                    isWarning={new Date(String(document.metadata.deadline)) < new Date()}
                  />
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Activity Timeline
            </h4>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <TimelineEvent
                  key={index}
                  event={event}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {!['signed', 'completed'].includes(document.status) && recipientEmail && (
              <button
                onClick={handleSendReminder}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell className="w-4 h-4" />
                Send Reminder
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {['signed', 'completed'].includes(document.status) && (
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                View Signed Copy
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  isWarning?: boolean;
}

function InfoRow({ label, value, isWarning }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

interface TimelineEvent {
  status: string;
  label: string;
  timestamp?: Date;
  description: string;
  color: string;
  isDone: boolean;
}

function buildTimeline(document: DocumentRecord): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      status: 'created',
      label: 'Created',
      timestamp: new Date(document.createdAt),
      description: 'Document uploaded',
      color: '#6366f1',
      isDone: true,
    },
    {
      status: 'sent',
      label: 'Sent',
      timestamp: document.metadata?.sentAt ? new Date(document.metadata.sentAt as string) : undefined,
      description: 'Sent to recipient',
      color: '#3b82f6',
      isDone: ['sent', 'viewed', 'signed', 'paid', 'completed'].includes(document.status),
    },
    {
      status: 'viewed',
      label: 'Viewed',
      timestamp: document.metadata?.viewedAt ? new Date(document.metadata.viewedAt as string) : undefined,
      description: 'Recipient viewed',
      color: '#06b6d4',
      isDone: ['viewed', 'signed', 'paid', 'completed'].includes(document.status),
    },
    {
      status: 'signed',
      label: 'Signed',
      timestamp: document.metadata?.signedAt ? new Date(document.metadata.signedAt as string) : undefined,
      description: 'Document signed',
      color: '#10b981',
      isDone: ['signed', 'paid', 'completed'].includes(document.status),
    },
    {
      status: 'paid',
      label: 'Paid',
      timestamp: document.metadata?.paidAt ? new Date(document.metadata.paidAt as string) : undefined,
      description: 'Payment received',
      color: '#f59e0b',
      isDone: ['paid', 'completed'].includes(document.status),
    },
    {
      status: 'completed',
      label: 'Completed',
      timestamp: document.metadata?.completedAt ? new Date(document.metadata.completedAt as string) : undefined,
      description: 'Workflow completed',
      color: '#059669',
      isDone: document.status === 'completed',
    },
  ];

  return events;
}

interface TimelineEventProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineEvent({ event, isLast }: TimelineEventProps) {
  return (
    <div className="flex gap-3">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        {event.isDone ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: event.color }}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div
            className="w-3 h-3 rounded-full mt-1.5"
            style={{ backgroundColor: '#e5e7eb', opacity: 0.5 }}
          />
        )}
        {!isLast && (
          <div
            className="w-0.5 h-8 my-1"
            style={{
              backgroundColor: event.isDone ? event.color : '#e5e7eb',
              opacity: event.isDone ? 1 : 0.5,
            }}
          />
        )}
      </div>

      {/* Timeline content */}
      <div className="pt-0.5 pb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {event.label}
          </p>
          {event.isDone && event.timestamp && (
            <span className="text-xs text-gray-400">
              {format(event.timestamp, 'MMM d, h:mm a')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {event.description}
        </p>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
