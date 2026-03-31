import { useState, useCallback, useRef, type FormEvent, type DragEvent } from 'react';
import { X, Upload, FileText, Send, CreditCard, Clock, User, PenTool, Calendar, Type, Plus, Trash2, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useUploadDocument, useSendDocument } from '@/lib/hooks';
import toast from 'react-hot-toast';

interface NewDocumentModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'configure' | 'review';

const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: PenTool, color: '#6366f1' },
  { type: 'initials', label: 'Initials', icon: Type, color: '#8b5cf6' },
  { type: 'date', label: 'Date', icon: Calendar, color: '#f59e0b' },
  { type: 'name', label: 'Full Name', icon: User, color: '#0ea5e9' },
  { type: 'text', label: 'Text', icon: Type, color: '#64748b' },
] as const;

interface FieldEntry {
  id: string;
  fieldType: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label: string;
}

export function NewDocumentModal({ open, onClose }: NewDocumentModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recipient info
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');

  // Payment
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');

  // Fields
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: '1', fieldType: 'signature', pageNumber: 1, x: 50, y: 600, width: 200, height: 60, required: true, label: 'Signature' },
    { id: '2', fieldType: 'date', pageNumber: 1, x: 300, y: 600, width: 150, height: 30, required: true, label: 'Date' },
    { id: '3', fieldType: 'name', pageNumber: 1, x: 50, y: 680, width: 200, height: 30, required: true, label: 'Full Name' },
  ]);

  const uploadMutation = useUploadDocument();
  const sendMutation = useSendDocument();

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setDocumentId(null);
    setRecipientName('');
    setRecipientEmail('');
    setMessage('');
    setDeadline('');
    setPaymentEnabled(false);
    setPaymentAmount('');
    setPaymentDescription('');
    setFields([
      { id: '1', fieldType: 'signature', pageNumber: 1, x: 50, y: 600, width: 200, height: 60, required: true, label: 'Signature' },
      { id: '2', fieldType: 'date', pageNumber: 1, x: 300, y: 600, width: 150, height: 30, required: true, label: 'Date' },
      { id: '3', fieldType: 'name', pageNumber: 1, x: 50, y: 680, width: 200, height: 30, required: true, label: 'Full Name' },
    ]);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Upload handlers ──
  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === 'application/pdf' || dropped.name.endsWith('.pdf') || dropped.name.endsWith('.docx'))) {
      handleFileSelected(dropped);
    } else {
      toast.error('Please upload a PDF or Word document');
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const result = await uploadMutation.mutateAsync({ file: selectedFile });
      setDocumentId(result.data.id);
      toast.success('Document uploaded successfully');
      setStep('configure');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      setFile(null);
    }
  };

  // ── Field management ──
  const addField = (type: string) => {
    const label = FIELD_TYPES.find(f => f.type === type)?.label || type;
    setFields(prev => [...prev, {
      id: String(Date.now()),
      fieldType: type,
      pageNumber: 1,
      x: 50,
      y: 400 + prev.length * 50,
      width: type === 'signature' ? 200 : 150,
      height: type === 'signature' ? 60 : 30,
      required: true,
      label,
    }]);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  // ── Send handler ──
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!documentId) return;

    if (!recipientEmail || !recipientName) {
      toast.error('Recipient name and email are required');
      return;
    }

    if (fields.length === 0) {
      toast.error('At least one signature field is required');
      return;
    }

    try {
      await sendMutation.mutateAsync({
        documentId,
        payload: {
          recipientEmail,
          recipientName,
          message: message || undefined,
          deadline: deadline || undefined,
          paymentEnabled,
          paymentAmount: paymentEnabled ? parseFloat(paymentAmount) : undefined,
          paymentDescription: paymentEnabled ? paymentDescription : undefined,
          fields: fields.map(f => ({
            fieldType: f.fieldType,
            pageNumber: f.pageNumber,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            required: f.required,
            label: f.label,
          })),
        },
      });
      toast.success(`Document sent to ${recipientName}!`);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send document');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {step === 'upload' ? 'Upload Document' : step === 'configure' ? 'Configure & Send' : 'Review & Send'}
              </h3>
              {file && <p className="text-xs text-gray-500">{file.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {(['upload', 'configure', 'review'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step === s ? 'bg-indigo-600 text-white' :
                    (['upload', 'configure', 'review'].indexOf(step) > i) ? 'bg-green-500 text-white' :
                    'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  }`}>
                    {(['upload', 'configure', 'review'].indexOf(step) > i) ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  {i < 2 && <div className="w-6 h-0.5 bg-gray-200 dark:bg-gray-600" />}
                </div>
              ))}
            </div>
            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
                'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-indigo-400'}`} />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {uploadMutation.isPending ? 'Uploading...' : 'Drop your document here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">PDF or Word documents up to 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(f);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Browse Files'}
              </button>
            </div>
          )}

          {step === 'configure' && (
            <form id="send-form" onSubmit={handleSend} className="space-y-6">
              {/* Recipient */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Recipient
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="John Smith"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="john@company.com"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Signature Fields */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-500" /> Signature Fields
                </h4>
                <div className="space-y-2 mb-3">
                  {fields.map((field) => {
                    const fieldDef = FIELD_TYPES.find(f => f.type === field.fieldType);
                    const Icon = fieldDef?.icon || Type;
                    return (
                      <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${fieldDef?.color}15`, color: fieldDef?.color }}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{field.label}</p>
                          <p className="text-xs text-gray-400">Page {field.pageNumber} · {field.required ? 'Required' : 'Optional'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map(ft => {
                    return (
                      <button
                        key={ft.type}
                        type="button"
                        onClick={() => addField(ft.type)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> {ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment */}
              <div className={`p-4 rounded-xl border transition-colors ${
                paymentEnabled ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700' : 'border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${paymentEnabled ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Require Payment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentEnabled(!paymentEnabled)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${paymentEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    style={{ width: 40, height: 22 }}
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                      paymentEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`} style={{ width: 18, height: 18, top: 2, transform: paymentEnabled ? 'translateX(20px)' : 'translateX(2px)' }} />
                  </button>
                </div>
                {paymentEnabled && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.50"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="250.00"
                        required={paymentEnabled}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</label>
                      <input
                        type="text"
                        value={paymentDescription}
                        onChange={e => setPaymentDescription(e.target.value)}
                        placeholder="Contract signing fee"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Message & Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message to Client</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Hi John, please review and sign this contract at your earliest convenience."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    <Clock className="w-3 h-3 inline mr-1" /> Signing Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </form>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Review before sending</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Document:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{file?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Recipient:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{recipientName} ({recipientEmail})</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fields:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{fields.length} field{fields.length !== 1 ? 's' : ''} to complete</p>
                  </div>
                  {deadline && (
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{new Date(deadline).toLocaleDateString()}</p>
                    </div>
                  )}
                  {paymentEnabled && (
                    <div>
                      <span className="text-gray-500">Payment:</span>
                      <p className="font-medium text-amber-600">${parseFloat(paymentAmount || '0').toFixed(2)}</p>
                    </div>
                  )}
                  {message && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Message:</span>
                      <p className="font-medium text-gray-900 dark:text-white italic">"{message}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <AlertCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  A branded email will be sent to {recipientEmail} with a secure link to sign the document.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={step === 'upload' ? handleClose : () => setStep(step === 'review' ? 'configure' : 'upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {step === 'upload' ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
          </button>

          {step === 'configure' && (
            <button
              onClick={() => {
                if (!recipientEmail || !recipientName) {
                  toast.error('Recipient name and email are required');
                  return;
                }
                setStep('review');
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Review <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 'review' && (
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all shadow-md disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4" /> Send to Client</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
