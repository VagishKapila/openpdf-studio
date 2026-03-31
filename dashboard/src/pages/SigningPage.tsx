import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, FileText, Lock, ChevronRight, X } from 'lucide-react';
import { SignaturePad } from '@/components/signing/SignaturePad';
import * as signingApi from '@/lib/signing-api';
import type { SignatureRequest, SignatureField, DocumentRecord } from '@/types';

type Step = 'loading' | 'error' | 'review' | 'sign' | 'confirm' | 'success';

interface LoadedData {
  request: SignatureRequest;
  document: DocumentRecord;
  sender: {
    name: string;
    email: string;
  };
  fields: SignatureField[];
}

interface SignedField {
  fieldId: string;
  value: string;
  type: 'draw' | 'type' | 'date' | 'name' | 'text';
  preview?: string;
}

export default function SigningPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<LoadedData | null>(null);
  const [signedFields, setSignedFields] = useState<Map<string, SignedField>>(new Map());
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Load signing request
  useEffect(() => {
    if (!token) {
      setStep('error');
      setError('Invalid signing link');
      return;
    }

    const loadRequest = async () => {
      try {
        const result = await signingApi.getSigningRequest(token);
        setData(result);
        setStep('review');
      } catch (err: any) {
        setStep('error');
        const message = err.message || 'Failed to load document';
        // Map common error messages
        if (message.includes('expired') || message.includes('Expired')) {
          setError('This signing link has expired');
        } else if (message.includes('signed') || message.includes('Signed')) {
          setError('This document has already been signed');
        } else if (message.includes('not found') || message.includes('Not found')) {
          setError('Signing request not found');
        } else if (message.includes('declined') || message.includes('Declined')) {
          setError('This signing request has been declined');
        } else {
          setError(message);
        }
      }
    };

    loadRequest();
  }, [token]);

  const totalFields = data?.fields.length || 0;
  const requiredFields = data?.fields.filter(f => f.required) || [];
  const completedRequired = Array.from(signedFields.values()).filter(f => {
    const field = data?.fields.find(df => df.id === f.fieldId);
    return field?.required && f.value;
  }).length;

  const currentField = data?.fields[currentFieldIndex];
  const canSubmit = requiredFields.length > 0 && completedRequired === requiredFields.length;

  const handleDecline = useCallback(async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to decline signing this document?')) return;

    try {
      await signingApi.declineSigningRequest(token);
      setStep('error');
      setError('You have declined to sign this document');
    } catch (err: any) {
      setError(err.message || 'Failed to decline request');
    }
  }, [token]);

  const handleFieldCapture = useCallback((value: string, type: 'draw' | 'type') => {
    if (!currentField) return;

    const newSignedFields = new Map(signedFields);
    newSignedFields.set(currentField.id, {
      fieldId: currentField.id,
      value,
      type,
      preview: value.substring(0, 50),
    });
    setSignedFields(newSignedFields);

    // Move to next field if available
    if (currentFieldIndex < totalFields - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  }, [currentField, currentFieldIndex, totalFields, signedFields]);

  const handleSignDateCapture = useCallback((value: string) => {
    if (!currentField) return;

    const newSignedFields = new Map(signedFields);
    newSignedFields.set(currentField.id, {
      fieldId: currentField.id,
      value,
      type: 'date',
      preview: value,
    });
    setSignedFields(newSignedFields);

    if (currentFieldIndex < totalFields - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  }, [currentField, currentFieldIndex, totalFields, signedFields]);

  const handleTextCapture = useCallback((value: string) => {
    if (!currentField) return;

    const newSignedFields = new Map(signedFields);
    newSignedFields.set(currentField.id, {
      fieldId: currentField.id,
      value,
      type: 'text',
      preview: value,
    });
    setSignedFields(newSignedFields);

    if (currentFieldIndex < totalFields - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  }, [currentField, currentFieldIndex, totalFields, signedFields]);

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;

    setSubmitting(true);
    try {
      const payload = Array.from(signedFields.values()).map(field => ({
        fieldId: field.fieldId,
        value: field.value,
        type: field.type,
      }));

      await signingApi.submitSignatures(token, { fields: payload });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit signatures');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  // LOADING STATE
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-2 border-red-100">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Cannot Sign Document</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Document Signed Successfully</h1>
          <p className="text-gray-600 mb-6">
            Your signature has been legally bound to this document. A signed copy has been sent to the sender's email.
          </p>
          <button
            onClick={() => window.close()}
            className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // REVIEW STATE
  if (step === 'review' && data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">DocuFlow</h1>
            <p className="text-gray-500 text-sm mt-1">Secure Document Signing</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
            {/* Document Info */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{data.document.fileName || data.document.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Sent by {data.sender.name}</p>
                </div>
              </div>

              {data.request.message && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Message from sender:</p>
                  <p className="text-sm text-blue-800">{data.request.message}</p>
                </div>
              )}

              {/* PDF Preview Placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <FileText className="mx-auto text-gray-400 mb-2" size={40} />
                <p className="text-gray-500 text-sm">PDF Preview • {data.document.pageCount || 1} page(s)</p>
                <p className="text-xs text-gray-400 mt-1">Preview integration coming soon</p>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Fields to Sign</p>
                    <p className="text-2xl font-bold text-gray-900">{totalFields}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Required</p>
                    <p className="text-2xl font-bold text-indigo-600">{requiredFields.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setStep('sign')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Continue to Sign <ChevronRight size={18} />
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-3 text-gray-600 hover:text-red-600 font-medium transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Footer Trust Indicator */}
          <div className="text-center mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock size={14} />
            Secured by DocuFlow • Legally Binding
          </div>
        </div>
      </div>
    );
  }

  // SIGN STATE
  if (step === 'sign' && data && currentField) {
    const isFieldSigned = signedFields.has(currentField.id);
    const fieldLabel = currentField.label || `${currentField.fieldType} Field`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sign Document</h1>
            <p className="text-sm text-gray-600 mt-1">
              {data.document.fileName || data.document.name}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Field {currentFieldIndex + 1} of {totalFields}
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {completedRequired} of {requiredFields.length} required signed
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentFieldIndex + 1) / totalFields) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Fields List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sticky top-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Fields</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.fields.map((field, idx) => {
                    const signed = signedFields.has(field.id);
                    const isCurrent = field.id === currentField.id;
                    return (
                      <button
                        key={field.id}
                        onClick={() => setCurrentFieldIndex(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : signed
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {signed ? (
                            <CheckCircle size={14} />
                          ) : field.required ? (
                            <span className="text-red-500 font-bold">*</span>
                          ) : null}
                          <span>{field.label || `${field.fieldType} (${idx + 1})`}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel: Input Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{fieldLabel}</h3>
                {currentField.required && (
                  <p className="text-xs text-red-600 font-semibold mb-4">REQUIRED</p>
                )}

                {/* Signature/Initials Fields */}
                {(currentField.fieldType === 'signature' || currentField.fieldType === 'initials') && (
                  <div className="space-y-4">
                    <SignaturePad
                      onCapture={handleFieldCapture}
                      width={300}
                      height={currentField.fieldType === 'initials' ? 100 : 150}
                    />
                  </div>
                )}

                {/* Date Field */}
                {currentField.fieldType === 'date' && (
                  <div className="space-y-4">
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      onChange={e => handleSignDateCapture(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Name Field */}
                {currentField.fieldType === 'name' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      onChange={e => handleTextCapture(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Text Field */}
                {currentField.fieldType === 'text' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter text"
                      onChange={e => handleTextCapture(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                {isFieldSigned && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    <span className="text-sm font-medium text-green-700">Field completed</span>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCurrentFieldIndex(Math.max(0, currentFieldIndex - 1))}
                  disabled={currentFieldIndex === 0}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentFieldIndex(Math.min(totalFields - 1, currentFieldIndex + 1))}
                  disabled={currentFieldIndex === totalFields - 1}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!canSubmit}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  Review & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CONFIRM STATE
  if (step === 'confirm' && data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
            <p className="text-gray-600 mt-2">{data.document.fileName || data.document.name}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 sm:p-8 space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Signature Summary</h3>
              <div className="space-y-3">
                {Array.from(signedFields.values()).map(field => {
                  const fieldData = data.fields.find(f => f.id === field.fieldId);
                  if (!fieldData) return null;
                  return (
                    <div key={field.fieldId} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{fieldData.label || fieldData.fieldType}</p>
                        {field.preview && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {field.type === 'draw' ? 'Signature captured' : field.preview}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legal Text */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-blue-900">Legal Binding Statement</p>
              <p className="text-sm text-blue-800">
                By clicking Submit below, you acknowledge and agree that:
              </p>
              <ul className="text-sm text-blue-800 space-y-2 ml-4">
                <li>Your electronic signature is legally binding and enforceable</li>
                <li>You intend to sign this document electronically</li>
                <li>You have read and understand the document contents</li>
              </ul>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={e => setAgreeToTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                I agree that my electronic signature is legally binding
              </span>
            </label>

            {/* Trust Indicator */}
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Lock className="text-gray-600" size={18} />
              <span className="text-sm font-medium text-gray-700">Secured by DocuFlow</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep('sign')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={!agreeToTerms || submitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Submit Signature
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
