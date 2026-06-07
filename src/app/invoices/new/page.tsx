'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

type UploadCardProps = {
  title: string;
  description: string;
  required?: boolean;
  file: File | null;
  accept: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function UploadCard({ title, description, required = false, file, accept, onChange, disabled = false }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const clearFile = () => {
    if (inputRef.current) inputRef.current.value = '';
    setError('');
    onChange(null);
  };

  const pickFile = (next: File | null) => {
    if (!next) return;
    const ext = next.name.split('.').pop()?.toLowerCase() || '';
    const isAccepted = ACCEPTED_EXTENSIONS.includes(ext) || next.type.includes('pdf') || next.type.startsWith('image/');
    if (!isAccepted) {
      setError('Unsupported file type. Use PDF, PNG, JPG, or JPEG.');
      clearFile();
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setError('File is too large. Maximum size is 10 MB.');
      clearFile();
      return;
    }
    setError('');
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-700" />
            <h3 className="font-semibold text-sm md:text-base">{title}</h3>
            {required && <span className="badge bg-amber-100 text-amber-700">Required</span>}
          </div>
          <p className="text-sm text-[var(--muted)] mt-1">{description}</p>
        </div>
      </div>

      <div className="p-4">
        {!file ? (
          <label
            className={`block rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
              disabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-70' : dragActive ? 'border-blue-400 bg-blue-50' : 'border-[var(--border)] bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (disabled) return;
              const dropped = e.dataTransfer.files?.[0];
              pickFile(dropped || null);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              disabled={disabled}
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[var(--border)]">
              <Upload size={18} className="text-slate-700" />
            </div>
            <p className="mt-3 text-sm font-medium">{disabled ? 'Not available while demo mode is on' : 'Drop file here or browse'}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">PDF, PNG, JPG or JPEG · Max 10 MB</p>
            {!disabled && <span className="mt-3 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium">Browse files</span>}
          </label>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{file.name}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {file.type ? file.type.split('/').pop()?.toUpperCase() : 'FILE'} · {formatBytes(file.size)}
                </p>
              </div>
              <span className="badge bg-green-100 text-green-700 shrink-0">Ready</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary !rounded-full !px-4 !py-2"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                Replace
              </button>
              <button
                type="button"
                className="btn btn-secondary !rounded-full !px-4 !py-2"
                onClick={clearFile}
                disabled={disabled}
              >
                Remove
              </button>
            </div>
          </div>
        )}
        {!file && !error && <p className="mt-3 text-[11px] text-[var(--muted)]">Accepted: PDF, PNG, JPG, JPEG. Maximum file size: 10 MB.</p>}
        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [rateConFile, setRateConFile] = useState<File | null>(null);
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [demoData, setDemoData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    api('/dashboard/summary')
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, []);

  const limitReached = useMemo(() => {
    if (!summary) return false;
    const limit = Number(summary.currentMonthLimit);
    if (!Number.isFinite(limit) || limit >= Number.MAX_SAFE_INTEGER) return false;
    return Number(summary.currentMonthInvoices || 0) >= limit;
  }, [summary]);

  const remaining = useMemo(() => {
    if (!summary) return null;
    const limit = Number(summary.currentMonthLimit);
    if (!Number.isFinite(limit) || limit >= Number.MAX_SAFE_INTEGER) return 'Unlimited';
    return Math.max(limit - Number(summary.currentMonthInvoices || 0), 0);
  }, [summary]);

  const canContinue = Boolean(demoData || (rateConFile && bolFile && !limitReached));
  const buttonLabel = demoData ? 'Create Demo Invoice' : 'Continue to Invoice Review';
  const submit = async () => {
    if (!demoData && (!rateConFile || !bolFile)) {
      setMsg('Please upload both required documents.');
      return;
    }
    if (!demoData && limitReached) {
      setMsg('You have reached your monthly invoice limit.');
      return;
    }

    setBusy(true);
    setMsg('');
    const fd = new FormData();
    if (rateConFile) fd.append('rateConFile', rateConFile);
    if (bolFile) fd.append('bolFile', bolFile);
    fd.append('demoData', String(demoData));

    try {
      const res = await api('/invoices/upload', { method: 'POST', body: fd });
      router.push(`/invoices/${res.invoiceId}`);
    } catch (e: any) {
      if (e?.statusCode === 401) {
        router.push('/login');
        return;
      }
      setMsg(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Create Invoice">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <div className="card-header flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Create Invoice</p>
                <h2 className="text-2xl font-semibold mt-1">Upload load documents</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Upload the Rate Confirmation and Bill of Lading for one completed load.</p>
              </div>
            </div>
          </div>

          <UploadCard
            title="Rate Confirmation"
            description="Upload the broker rate confirmation showing the agreed load rate."
            required
            file={rateConFile}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={setRateConFile}
            disabled={demoData}
          />

          <UploadCard
            title="Bill of Lading"
            description="Upload the completed or signed BOL for the load."
            required
            file={bolFile}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={setBolFile}
            disabled={demoData}
          />

          <div className="card">
            <div className="card-header flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Use sample data</h3>
                  <span className={`badge ${demoData ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>Testing only</span>
                </div>
                <p className="text-sm text-[var(--muted)] mt-1">Skip document extraction and create a synthetic test invoice.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={demoData}
                onClick={() => setDemoData((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${demoData ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${demoData ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {msg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {msg}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">What happens next</h3>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">1</div>
                <p>Upload the documents for one completed load.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">2</div>
                <p>We extract load, billing, and broker details.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">3</div>
                <p>You review and correct the invoice data.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">4</div>
                <p>You generate the final PDF from the trucking template.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Usage</h3>
            </div>
            <div className="card-body space-y-3 text-sm">
              {summaryLoading ? (
                <div className="skeleton h-20" />
              ) : summary ? (
                <>
                  <div className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">This month</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {summary.currentMonthInvoices || 0} / {summary.currentMonthLimit >= Number.MAX_SAFE_INTEGER ? 'Unlimited' : summary.currentMonthLimit}
                    </p>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {remaining === 'Unlimited' ? 'Unlimited invoices remaining' : `${remaining} invoices remaining`}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width:
                          summary.currentMonthLimit >= Number.MAX_SAFE_INTEGER
                            ? '8%'
                            : `${Math.min(((summary.currentMonthInvoices || 0) / summary.currentMonthLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  {limitReached && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      You have reached your monthly invoice limit.
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[var(--muted)]">Usage unavailable.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Start</h3>
            </div>
            <div className="card-body space-y-3">
              <button
                className="btn btn-primary w-full !rounded-full"
                disabled={busy || !canContinue}
                onClick={submit}
              >
                {busy ? 'Uploading & extracting…' : buttonLabel}
              </button>
              <div className="flex flex-wrap gap-2 text-[11px] text-[var(--muted)]">
                {!demoData && (!rateConFile || !bolFile) && <span>Rate Con and BOL are required for normal extraction.</span>}
                {limitReached && <span className="text-red-700">Monthly limit reached.</span>}
                {demoData && <span>Testing mode bypasses document extraction.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
