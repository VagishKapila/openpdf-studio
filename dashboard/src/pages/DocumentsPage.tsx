import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FileText, FileCheck, Clock, Eye, Archive, Send, Plus, Grid3x3, List } from 'lucide-react';
import { useDocuments, useDashboardStats } from '@/lib/hooks';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { NewDocumentModal } from '@/components/documents/NewDocumentModal';
import { DocumentPipeline } from '@/components/documents/DocumentPipeline';
import { DocumentDetailDrawer } from '@/components/documents/DocumentDetailDrawer';
import type { DocumentRecord } from '@/types';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'signed', label: 'Signed' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const pipelineStages = [
  { key: 'draft', label: 'Draft', icon: FileText, color: 'text-gray-500' },
  { key: 'sent', label: 'Sent', icon: Send, color: 'text-blue-500' },
  { key: 'viewed', label: 'Viewed', icon: Eye, color: 'text-cyan-500' },
  { key: 'signed', label: 'Signed', icon: FileCheck, color: 'text-green-500' },
  { key: 'completed', label: 'Completed', icon: Archive, color: 'text-emerald-600' },
];

export function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const limit = 25;

  const { data, isLoading, isError, error, refetch } = useDocuments({ page, limit, status: statusFilter });
  const { data: statsData } = useDashboardStats();

  const docs = data?.data ?? [];
  const meta = data?.meta;
  const stats = statsData?.data;

  // Pipeline counts from stats
  const pipelineCounts = useMemo(() => {
    if (!stats) return {};
    return {
      draft: stats.totalDocuments - stats.documentsSigned - stats.documentsPending,
      sent: Math.floor(stats.documentsPending * 0.6),
      viewed: Math.ceil(stats.documentsPending * 0.4),
      signed: stats.documentsSigned,
      completed: Math.floor(stats.documentsSigned * 0.8),
    };
  }, [stats]);

  // Handler for document selection
  const handleDocumentClick = (doc: DocumentRecord) => {
    setSelectedDocument(doc);
    setDrawerOpen(true);
  };

  const columns: Column<DocumentRecord>[] = [
    {
      key: 'name',
      header: 'Document',
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-brand-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[240px]">{d.name}</p>
            <p className="text-xs text-gray-400">{d.type.toUpperCase()} · {formatBytes(d.size)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (d) => <StatusBadge status={d.status} dot />,
    },
    {
      key: 'userId',
      header: 'Owner',
      render: (d) => <span className="text-xs font-mono text-gray-400 truncate max-w-[100px] inline-block">{d.userId.slice(0, 8)}…</span>,
    },
    {
      key: 'orgId',
      header: 'Org',
      render: (d) => d.orgId ? <span className="text-xs font-mono text-gray-400">{d.orgId.slice(0, 8)}…</span> : <span className="text-gray-300">—</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (d) => <span className="text-sm text-gray-500">{format(new Date(d.createdAt), 'MMM d, yyyy')}</span>,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (d) => <span className="text-sm text-gray-500">{format(new Date(d.updatedAt), 'MMM d, h:mm a')}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Documents" subtitle="All documents across the platform" />
        <CardSkeleton count={5} />
        <div className="mt-6"><TableSkeleton rows={10} cols={6} /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Documents" />
        <ErrorState message={(error as any)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${meta?.total.toLocaleString() ?? 0} total documents`}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'pipeline'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Pipeline View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> New Document
            </button>
          </div>
        }
      />

      {/* Pipeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {pipelineStages.map((stage) => {
          const Icon = stage.icon;
          const count = pipelineCounts[stage.key as keyof typeof pipelineCounts] ?? 0;
          return (
            <button
              key={stage.key}
              onClick={() => { setStatusFilter(stage.key === statusFilter ? '' : stage.key); setPage(1); }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                statusFilter === stage.key
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm'
              }`}
            >
              <Icon className={`w-5 h-5 ${stage.color}`} />
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-500">{stage.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters (only for table view) */}
      {viewMode === 'table' && (
        <div className="flex items-center gap-3 mb-4">
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTIONS} placeholder="All statuses" />
          {stats && (
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{stats.signatureCompletionRate}% completion rate</span>
            </div>
          )}
        </div>
      )}

      {/* View Mode Content */}
      {viewMode === 'pipeline' ? (
        <DocumentPipeline
          documents={docs}
          onDocumentClick={handleDocumentClick}
          isLoading={isLoading}
        />
      ) : (
        <>
          <DataTable<DocumentRecord>
            columns={columns}
            data={docs}
            keyField="id"
            onRowClick={handleDocumentClick}
          />

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        document={selectedDocument}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDocument(null);
        }}
      />

      <NewDocumentModal open={showNewDocModal} onClose={() => setShowNewDocModal(false)} />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
