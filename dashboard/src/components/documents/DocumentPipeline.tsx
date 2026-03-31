import { FileText, Send, Eye, FileCheck, CreditCard, Archive } from 'lucide-react';
import type { DocumentRecord } from '@/types';

interface DocumentPipelineProps {
  documents: DocumentRecord[];
  onDocumentClick: (doc: DocumentRecord) => void;
  isLoading?: boolean;
}

const PIPELINE_STAGES = [
  { key: 'draft', label: 'Draft', icon: FileText, bgColor: '#f3f4f6', borderColor: '#d1d5db', textColor: 'text-gray-600', dotColor: '#6b7280' },
  { key: 'sent', label: 'Sent', icon: Send, bgColor: '#eff6ff', borderColor: '#3b82f6', textColor: 'text-blue-600', dotColor: '#3b82f6' },
  { key: 'viewed', label: 'Viewed', icon: Eye, bgColor: '#ecf8ff', borderColor: '#06b6d4', textColor: 'text-cyan-600', dotColor: '#06b6d4' },
  { key: 'signed', label: 'Signed', icon: FileCheck, bgColor: '#ecfdf5', borderColor: '#10b981', textColor: 'text-green-600', dotColor: '#10b981' },
  { key: 'paid', label: 'Paid', icon: CreditCard, bgColor: '#fffbeb', borderColor: '#f59e0b', textColor: 'text-amber-600', dotColor: '#f59e0b' },
  { key: 'completed', label: 'Completed', icon: Archive, bgColor: '#ecfdf5', borderColor: '#059669', textColor: 'text-emerald-600', dotColor: '#059669' },
];

export function DocumentPipeline({ documents, onDocumentClick, isLoading }: DocumentPipelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full" />
        </div>
      </div>
    );
  }

  // Group documents by status
  const documentsByStatus = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = documents.filter(doc => doc.status === stage.key);
    return acc;
  }, {} as Record<string, DocumentRecord[]>);

  return (
    <div className="overflow-x-auto -mx-6 px-6 pb-4">
      <div className="flex gap-6 min-w-min">
        {PIPELINE_STAGES.map((stage) => {
          const Icon = stage.icon;
          const stageDocuments = documentsByStatus[stage.key] || [];

          return (
            <div key={stage.key} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div
                className="mb-4 pb-3 border-b-2 flex items-center justify-between"
                style={{ borderColor: stage.borderColor }}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${stage.textColor}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{stage.label}</h3>
                </div>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {stageDocuments.length}
                </span>
              </div>

              {/* Document Cards */}
              <div className="space-y-3">
                {stageDocuments.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-center">
                    <p className="text-sm text-gray-400">No documents</p>
                  </div>
                ) : (
                  stageDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      stageColor={stage.dotColor}
                      onDocumentClick={onDocumentClick}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DocumentCardProps {
  document: DocumentRecord;
  stageColor: string;
  onDocumentClick: (doc: DocumentRecord) => void;
}

function DocumentCard({ document, stageColor, onDocumentClick }: DocumentCardProps) {
  // Extract recipient info from metadata or show placeholder
  const recipientEmail = (document.metadata?.recipientEmail as string) || 'No recipient';
  const recipientName = (document.metadata?.recipientName as string) || '';

  // Calculate relative time
  const timeAgo = getRelativeTime(new Date(document.updatedAt));

  // Truncate filename
  const truncatedName = document.name.length > 30
    ? document.name.substring(0, 27) + '...'
    : document.name;

  return (
    <button
      onClick={() => onDocumentClick(document)}
      className="w-full text-left p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:-translate-y-0.5"
    >
      {/* Status Dot + Title */}
      <div className="flex items-start gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: stageColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {truncatedName}
          </p>
        </div>
      </div>

      {/* Recipient Email */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate px-4">
        {recipientEmail}
      </p>

      {/* Recipient Name (if available) */}
      {recipientName && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-4 truncate">
          {recipientName}
        </p>
      )}

      {/* Time Since Update */}
      <p className="text-xs text-gray-400 dark:text-gray-500 px-4">
        {timeAgo}
      </p>
    </button>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
