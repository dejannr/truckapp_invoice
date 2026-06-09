'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

function pretty(value: any) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US');
}

export default function AdminExtractionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    api(`/admin/extraction-runs/${id}/debug`).then(setData).catch(() => setData(null));
  }, [id]);

  return (
    <AppShell title="Admin Extractions">
      {!data ? (
        <div className="skeleton h-96" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-slate-100 text-slate-700">{data.run.status}</span>
                <span className="badge bg-blue-100 text-blue-700">{data.run.model || 'No model'}</span>
                <span className="badge bg-slate-100 text-slate-700">{data.run.promptVersion || '-'}</span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Extraction Debug</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Run {data.run.id}</p>
            </div>
            <Link href="/admin/extractions" className="btn btn-secondary self-start">
              Back to runs
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card"><div className="card-body space-y-1"><p className="text-xs uppercase tracking-wide text-[var(--muted)]">Company</p><p className="font-semibold text-slate-950">{data.company?.name || '-'}</p><p className="text-sm text-[var(--muted)]">{data.company?.plan || '-'}</p></div></div>
            <div className="card"><div className="card-body space-y-1"><p className="text-xs uppercase tracking-wide text-[var(--muted)]">Invoice</p><p className="font-semibold text-slate-950">{data.invoice?.invoiceNumber || `Draft-${String(data.invoice?.id || '').slice(0, 8)}`}</p><p className="text-sm text-[var(--muted)]">{data.invoice?.status || '-'}</p></div></div>
            <div className="card"><div className="card-body space-y-1"><p className="text-xs uppercase tracking-wide text-[var(--muted)]">Started</p><p className="font-semibold text-slate-950">{formatDate(data.run.startedAt)}</p><p className="text-sm text-[var(--muted)]">Completed: {formatDate(data.run.completedAt)}</p></div></div>
            <div className="card"><div className="card-body space-y-1"><p className="text-xs uppercase tracking-wide text-[var(--muted)]">Error</p><p className="font-semibold text-slate-950">{data.run.errorMessage || 'None'}</p><p className="text-sm text-[var(--muted)]">Extraction run details</p></div></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Source Text</h3></div>
              <div className="card-body space-y-4">
                {(['rateCon', 'bol'] as const).map((key) => (
                  <details key={key} className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4" open={key === 'rateCon'}>
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{key === 'rateCon' ? 'Rate Con' : 'BOL'}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{data.sourceFiles[key].path || 'No file path'}</p>
                      </div>
                      <span className="badge bg-slate-100 text-slate-700">{data.sourceFiles[key].text ? 'Extracted text' : 'No text'}</span>
                    </summary>
                    <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-800">{data.sourceFiles[key].text || 'No readable text extracted.'}</pre>
                  </details>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Prompt Sent To Groq</h3></div>
              <div className="card-body space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">System Prompt</p>
                  <pre className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-800">{data.prompt.system}</pre>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">User Prompt</p>
                  <pre className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-800 max-h-[420px] overflow-auto">{data.prompt.user}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Groq Response</h3></div>
              <div className="card-body">
                <pre className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-800 max-h-[540px] overflow-auto">{pretty(data.groqResponse)}</pre>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Parsed Extraction</h3></div>
              <div className="card-body">
                <pre className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-800 max-h-[540px] overflow-auto">{pretty(data.extractedJson)}</pre>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between gap-3">
              <h3 className="font-semibold">Saved Invoice Snapshot</h3>
              <span className="text-xs text-[var(--muted)]">Normalized invoice fields written to PostgreSQL</span>
            </div>
            <div className="card-body">
              <pre className="rounded-2xl border border-[var(--border)] bg-slate-50/60 p-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-800 max-h-[540px] overflow-auto">{pretty(data.normalizedInvoice)}</pre>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
