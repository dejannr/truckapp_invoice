'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';
import { statusBadge } from '@/lib/ui';
import { Eye, X } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [viewer, setViewer] = useState<{ title: string; url: string; ext: string } | null>(null);
  useEffect(() => {
    let timer: any;
    const load = async () => {
      const res = await api(`/invoices/${id}`);
      setInvoice(res);
      if (res.status === 'EXTRACTING') timer = setTimeout(load, 3000);
    };
    load();
    return () => clearTimeout(timer);
  }, [id]);
  const [actionMsg, setActionMsg] = useState('');
  const openPreview = (title: string, kind: 'rate-con' | 'bol' | 'generated', fallbackPath?: string | null) => {
    if (!fallbackPath) {
      setActionMsg(`${title} is not available yet.`);
      return;
    }
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invoices/${id}/file/${kind}`;
    const ext = String(fallbackPath).toLowerCase().split('.').pop() || '';
    setViewer({ title, url, ext });
  };

  return <AppShell title="Invoice Detail">
    {!invoice ? <div className="skeleton h-60" /> : <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <div className="card"><div className="card-header flex justify-between"><h3 className="font-semibold">Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}</h3>{statusBadge(invoice.status)}</div><div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><p><span className="text-[var(--muted)]">Broker:</span> {invoice.brokerName || '-'}</p><p><span className="text-[var(--muted)]">Load #:</span> {invoice.loadNumber || '-'}</p><p><span className="text-[var(--muted)]">Route:</span> {(invoice.pickupCity || '-') + ' → ' + (invoice.deliveryCity || '-')}</p><p><span className="text-[var(--muted)]">Amount:</span> ${invoice.totalAmount || 0}</p></div></div>
        {invoice.status === 'EXTRACTING' && <div className="card"><div className="card-body"><p className="text-blue-700 font-medium">Extracting invoice data...</p><p className="text-sm text-[var(--muted)]">This can take a short moment. You can stay on this page while we process your documents.</p></div></div>}
        {invoice.status === 'FAILED' && <div className="card"><div className="card-body"><p className="text-red-700 font-medium">Extraction failed</p><p className="text-sm text-[var(--muted)]">{invoice.extractionRuns?.[0]?.errorMessage || 'The extraction job failed. Please verify document quality and try again.'}</p></div></div>}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Invoice Preview</h3></div>
          <div className="card-body">
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Invoice</p>
                  <h2 className="text-2xl font-semibold">{invoice.invoiceNumber || `Draft-${invoice.id.slice(0, 8)}`}</h2>
                </div>
                <div className="text-right text-sm bg-slate-50 border border-[var(--border)] rounded-xl px-3 py-2">
                  <p><span className="text-[var(--muted)]">Issue:</span> {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}</p>
                  <p><span className="text-[var(--muted)]">Due:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                  <p className="text-xs text-[var(--muted)] mb-1">Bill To</p>
                  <p className="font-medium">{invoice.brokerName || '-'}</p>
                  <p>{invoice.brokerAddressLine1 || '-'}</p>
                  <p>{[invoice.brokerCity, invoice.brokerState, invoice.brokerZipCode].filter(Boolean).join(', ') || '-'}</p>
                  <p>{invoice.brokerEmail || '-'}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                  <p className="text-xs text-[var(--muted)] mb-1">Load Details</p>
                  <p><span className="text-[var(--muted)]">Load #:</span> {invoice.loadNumber || '-'}</p>
                  <p><span className="text-[var(--muted)]">BOL #:</span> {invoice.bolNumber || '-'}</p>
                  <p><span className="text-[var(--muted)]">Route:</span> {(invoice.pickupCity || '-') + ' → ' + (invoice.deliveryCity || '-')}</p>
                  <p><span className="text-[var(--muted)]">Driver:</span> {invoice.driverName || '-'}</p>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-xs text-[var(--muted)] mb-2">Charges</p>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <p>Line Haul: ${invoice.lineHaulAmount || 0}</p>
                  <p>Fuel Surcharge: ${invoice.fuelSurchargeAmount || 0}</p>
                  <p>Accessorial: ${invoice.accessorialAmount || 0}</p>
                  <p>Detention: ${invoice.detentionAmount || 0}</p>
                  <p>Lumper: ${invoice.lumperAmount || 0}</p>
                  <p>Other: ${invoice.otherAmount || 0}</p>
                </div>
                <p className="mt-3 text-lg font-semibold">Total: ${invoice.totalAmount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Files</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Rate Con', path: invoice.rateConFilePath, kind: 'rate-con' as const },
              { label: 'BOL', path: invoice.bolFilePath, kind: 'bol' as const },
              { label: 'Generated Invoice', path: invoice.generatedPdfPath, kind: 'generated' as const },
            ].map((f) => (
              <div key={f.label} className="border border-[var(--border)] rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">{f.label}</p>
                  <span className={`badge ${f.path ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{f.path ? 'Available' : 'Pending'}</span>
                </div>
                <p className="text-xs text-[var(--muted)] mb-3 truncate">{f.path ? String(f.path).split('/').pop() : 'No file yet'}</p>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 btn btn-secondary"
                  onClick={() => openPreview(f.label, f.kind, f.path)}
                >
                  <Eye size={14} /> {f.path ? 'Preview File' : 'Preview Placeholder'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Explanation</h3>
          </div>
          <div className="card-body space-y-3">
            <div className={`rounded-2xl border p-4 ${invoice.status === 'NEEDS_REVIEW' ? 'border-blue-300 bg-blue-50/70' : 'border-[var(--border)] bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold">1</span>
                <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)]">STEP 1</span>
              </div>
              <p className="font-semibold text-[15px] mb-3">Review & Edit Extracted Data</p>
              <Link href={`/invoices/${id}/review`} className="btn btn-secondary w-full text-center block">Open Review Screen</Link>
            </div>

            <div className={`rounded-2xl border p-4 ${invoice.status === 'GENERATED' ? 'border-green-300 bg-green-50/70' : 'border-[var(--border)] bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold">2</span>
                <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)]">STEP 2</span>
              </div>
              <p className="font-semibold text-[15px] mb-3">Generate & Download PDF</p>
              {invoice.generatedPdfPath ? (
                <a className="btn btn-primary w-full text-center block" href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invoices/${id}/download`} target="_blank">Download PDF</a>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={async () => {
                    try {
                      await api(`/invoices/${id}/generate-pdf`, { method: 'POST' });
                      const fresh = await api(`/invoices/${id}`);
                      setInvoice(fresh);
                      setActionMsg('Invoice generated. You can download it now.');
                    } catch (e: any) {
                      setActionMsg(e?.message || 'Generation failed');
                    }
                  }}
                >
                  Generate PDF
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold">3</span>
                <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)]">STEP 3</span>
              </div>
              <p className="font-semibold text-[15px] mb-3">Send to Customer/Broker</p>
              <button className="btn btn-secondary w-full" onClick={() => setActionMsg('Marked as sent (UI placeholder for MVP).')}>Mark as Sent</button>
            </div>
            {actionMsg && <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">{actionMsg}</p>}
          </div>
        </div>
      </div>
    </div>}
    {viewer && (
      <div className="fixed inset-0 z-50 bg-black/35 flex justify-end">
        <div className="h-full w-full max-w-3xl bg-white border-l border-[var(--border)] flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold">{viewer.title}</h3>
            <button className="btn btn-secondary" onClick={() => setViewer(null)}><X size={16} /></button>
          </div>
          <div className="flex-1 bg-slate-100">
            {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(viewer.ext) ? (
              <img src={viewer.url} alt={viewer.title} className="w-full h-full object-contain" />
            ) : (
              <iframe title={viewer.title} src={viewer.url} className="w-full h-full border-0" />
            )}
          </div>
        </div>
      </div>
    )}
  </AppShell>;
}
