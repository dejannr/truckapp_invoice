'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Eye, RefreshCw, X } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { InvoiceReviewWorkspace } from '@/components/invoices/invoice-review-workspace';
import { api } from '@/lib/api';
import { statusBadge } from '@/lib/ui';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [viewer, setViewer] = useState<{ title: string; url: string; ext: string } | null>(null);
  const [actionMsg, setActionMsg] = useState('');

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

  const isExtracting = invoice?.status === 'EXTRACTING' || invoice?.status === 'UPLOADED';
  const isFailed = invoice?.status === 'FAILED';
  const isNeedsReview = invoice?.status === 'NEEDS_REVIEW';
  const isGenerated = invoice?.status === 'GENERATED';
  const isSent = invoice?.status === 'SENT';
  const editMode = searchParams.get('edit') === '1';
  const inReviewMode = isNeedsReview || editMode;
  const currentStep = inReviewMode ? 2 : isSent ? 4 : isGenerated ? 3 : 1;
  const readyToGenerate = Boolean(
    invoice &&
      invoice.brokerName &&
      invoice.totalAmount &&
      (invoice.loadNumber || invoice.bolNumber) &&
      (invoice.pickupCity || invoice.pickupDate) &&
      (invoice.deliveryCity || invoice.deliveryDate),
  );

  const workflowSteps = [
    { number: 1, label: 'Documents Uploaded' },
    { number: 2, label: 'Review Details' },
    { number: 3, label: 'Generate Invoice' },
    { number: 4, label: 'Sent' },
  ];

  const files = [
    { label: 'Rate Con', path: invoice?.rateConFilePath, kind: 'rate-con' as const },
    { label: 'BOL', path: invoice?.bolFilePath, kind: 'bol' as const },
    { label: 'Generated Invoice', path: invoice?.generatedPdfPath, kind: 'generated' as const },
  ];
  const fileUrl = (kind: 'rate-con' | 'bol' | 'generated') =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invoices/${id}/file/${kind}`;

  const openPreview = (title: string, kind: 'rate-con' | 'bol' | 'generated', fallbackPath?: string | null) => {
    if (!fallbackPath) {
      setActionMsg(`${title} is not available yet.`);
      return;
    }
    const url = fileUrl(kind);
    const ext = String(fallbackPath).toLowerCase().split('.').pop() || '';
    setViewer({ title, url, ext });
  };

  const saveReview = async (draft: any) => {
    const updated = await api(`/invoices/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setInvoice(updated);
    return updated;
  };

  const generatePdf = async () => {
    const updated = await api(`/invoices/${id}/generate-pdf`, { method: 'POST' });
    const fresh = await api(`/invoices/${id}`);
    setInvoice(fresh);
    return updated;
  };

  const markAsSent = async () => {
    try {
      setActionMsg('');
      await api(`/invoices/${id}/mark-sent`, { method: 'POST' });
      const fresh = await api(`/invoices/${id}`);
      setInvoice(fresh);
      setActionMsg('Invoice marked as sent.');
    } catch (e: any) {
      setActionMsg(e?.message || 'Could not mark invoice as sent.');
    }
  };

  const retryExtraction = async () => {
    try {
      setActionMsg('');
      await api(`/invoices/${id}/retry-extraction`, { method: 'POST' });
      const fresh = await api(`/invoices/${id}`);
      setInvoice(fresh);
      setActionMsg('Extraction restarted.');
    } catch (e: any) {
      setActionMsg(e?.message || 'Could not retry extraction.');
    }
  };

  if (!invoice) {
    return (
      <AppShell title="Invoice Detail">
        <div className="skeleton h-60" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Invoice Detail">
      <div className="space-y-4 pb-40 md:pb-32">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="card">
              <div className="card-header flex justify-between items-start gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{invoice.invoiceNumber ? 'Invoice' : 'Draft Invoice'}</p>
                  <h3 className="font-semibold text-lg md:text-xl break-words">{invoice.invoiceNumber || `Draft-${invoice.id.slice(0, 8)}`}</h3>
                  <p className="text-sm text-[var(--muted)] mt-1 leading-5">
                    Load {invoice.loadNumber || '-'} · {invoice.brokerName || 'Broker not set'} · {(invoice.pickupCity || '-') + ' → ' + (invoice.deliveryCity || '-')}
                  </p>
                </div>
                {statusBadge(invoice.status)}
              </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p><span className="text-[var(--muted)]">Broker:</span> {invoice.brokerName || '-'}</p>
                <p><span className="text-[var(--muted)]">Load #:</span> {invoice.loadNumber || '-'}</p>
                <p><span className="text-[var(--muted)]">Route:</span> {(invoice.pickupCity || '-') + ' → ' + (invoice.deliveryCity || '-')}</p>
                <p><span className="text-[var(--muted)]">Amount:</span> ${invoice.totalAmount || 0}</p>
              </div>
            </div>

            {isExtracting && (
              <div className="card">
                <div className="card-body space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                    <div>
                      <p className="font-semibold">Preparing your invoice</p>
                      <p className="text-sm text-[var(--muted)]">We are reading the Rate Con and BOL and filling the invoice details.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {files.slice(0, 2).map((file) => (
                      <div key={file.label} className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                        <p className="font-medium">{file.label}</p>
                        <p className="text-[var(--muted)] truncate">{file.path ? String(file.path).split('/').pop() : 'Pending upload'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isFailed && (
              <div className="card">
                <div className="card-body space-y-4">
                  <div>
                    <p className="font-semibold text-red-700">We could not read the documents</p>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {invoice.extractionRuns?.[0]?.errorMessage || 'The extraction job failed. You can retry, review the files, or enter the details manually.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {files.slice(0, 2).map((file) => (
                      <div key={file.label} className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                        <p className="font-medium">{file.label}</p>
                        <p className="text-[var(--muted)] truncate">{file.path ? String(file.path).split('/').pop() : 'Missing'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="btn btn-secondary w-full inline-flex items-center justify-center gap-2" onClick={retryExtraction}>
                      <RefreshCw size={14} /> Retry Extraction
                    </button>
                    <Link href={`/invoices/${id}/review`} className="btn btn-secondary w-full text-center block">
                      Enter Details Manually
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {inReviewMode && (
              <InvoiceReviewWorkspace
                invoice={invoice}
                setInvoice={setInvoice}
                onSave={saveReview}
                onGenerate={generatePdf}
                compact
                showActions={false}
              />
            )}

            {!isExtracting && !isFailed && !inReviewMode && (
              <>
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

                {(isGenerated || isSent) && invoice.generatedPdfPath && (
                  <div className="card">
                    <div className="card-header flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">PDF Preview</h3>
                        <p className="text-xs text-[var(--muted)] mt-1">Open the generated invoice before downloading or sending it again.</p>
                      </div>
                      <span className={`badge ${isSent ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{isSent ? 'Sent' : 'Generated'}</span>
                    </div>
                    <div className="card-body">
                      <div className="rounded-2xl border border-[var(--border)] bg-slate-100 overflow-hidden">
                        <iframe
                          title="Generated Invoice Preview"
                          src={fileUrl('generated')}
                          className="w-full h-[820px] border-0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold">Load Summary</h3>
                  </div>
                  <div className="card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Broker</p>
                      <p className="font-medium mt-1">{invoice.brokerName || 'Not provided'}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Load</p>
                      <p className="font-medium mt-1">{invoice.loadNumber || 'Not provided'}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Route</p>
                      <p className="font-medium mt-1">{(invoice.pickupCity || 'Not provided') + ' → ' + (invoice.deliveryCity || 'Not provided')}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Driver</p>
                      <p className="font-medium mt-1">{invoice.driverName || 'Not provided'}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Dates</p>
                      <p className="font-medium mt-1">
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'No issue date'}{' '}
                        · {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Total</p>
                      <p className="font-medium mt-1">${invoice.totalAmount || 0}</p>
                    </div>
                    {isSent && (
                      <div className="rounded-xl border border-green-200 bg-green-50/70 p-3 sm:col-span-2 lg:col-span-3">
                        <p className="text-[11px] uppercase tracking-wide text-green-700">Sent</p>
                        <p className="font-medium mt-1 text-green-900">{invoice.sentAt ? new Date(invoice.sentAt).toLocaleString() : 'Sent'}</p>
                        <p className="text-xs text-green-700 mt-1">{invoice.sentBy?.name || invoice.sentBy?.email || 'Sent by current user'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h3 className="font-semibold">Source Documents</h3></div>
                  <div className="card-body grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {files.map((f) => (
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
                        {f.path && (
                          <a
                            className="mt-2 block w-full text-center btn btn-secondary"
                            href={fileUrl(f.kind)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="card xl:sticky xl:top-24">
              <div className="card-header">
                <h3 className="font-semibold">Workflow</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="space-y-2">
                  {workflowSteps.map((step) => {
                    const isCurrent = step.number === currentStep;
                    const isDone = step.number < currentStep;
                    const StepInner = (
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                            isCurrent
                              ? 'border-green-600 bg-green-600 text-white'
                              : isDone
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-[var(--border)] bg-slate-50 text-slate-500'
                          }`}
                        >
                          {isDone ? <Check size={14} /> : step.number}
                        </div>
                        <p className={`text-sm font-medium ${isCurrent ? 'text-green-900' : isDone ? 'text-slate-900' : 'text-[var(--muted)]'}`}>
                          {step.label}
                        </p>
                      </div>
                    );

                    const StepCard = (
                      <div
                        className={`rounded-2xl border p-3 transition-colors ${
                          isCurrent ? 'border-green-400 border-dashed bg-green-50/80' : 'border-[var(--border)] bg-white'
                        }`}
                      >
                        {StepInner}
                      </div>
                    );

                    if (step.number === 2 && !inReviewMode) {
                      return (
                        <Link key={step.number} href={`/invoices/${id}?edit=1`} className="block">
                          {StepCard}
                        </Link>
                      );
                    }

                    return <div key={step.number}>{StepCard}</div>;
                  })}
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  {(isGenerated || isSent) && invoice.generatedPdfPath && (
                    <a
                      className="btn btn-secondary w-full text-center block"
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invoices/${id}/download`}
                      target="_blank"
                    >
                      Download PDF
                    </a>
                  )}
                  {isExtracting && (
                    <button className="btn btn-secondary w-full" disabled>
                      Extracting invoice…
                    </button>
                  )}
                  {isFailed && (
                    <button className="btn btn-secondary w-full" disabled>
                      Extraction failed
                    </button>
                  )}
                  {actionMsg && <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mt-3">{actionMsg}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 left-4 right-4 md:left-[calc(18rem+1rem)] md:right-4 z-30">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-white/70 bg-white/75 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="px-4 py-3 md:px-5 md:py-4">
              <div className="flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Link href="/invoices" className="btn btn-secondary !rounded-full !px-4 !py-2 text-center shrink-0">
                    Back
                  </Link>
                  {inReviewMode && (
                    <>
                      <button
                        className="btn btn-secondary !rounded-full !px-4 !py-2 shrink-0"
                        onClick={async () => {
                          const saved = await saveReview(invoice);
                          if (saved) setActionMsg('Draft saved.');
                        }}
                      >
                        Save Draft
                      </button>
                      <button
                        className="btn btn-primary !rounded-full !px-4 !py-2 shrink-0"
                        disabled={!readyToGenerate}
                        onClick={async () => {
                          try {
                            await saveReview(invoice);
                            await generatePdf();
                            router.replace(`/invoices/${id}`);
                            setActionMsg('Invoice generated. You can download it now.');
                          } catch (e: any) {
                            setActionMsg(e?.message || 'Generation failed');
                          }
                        }}
                      >
                        Generate
                      </button>
                    </>
                  )}
                  {!inReviewMode && (isGenerated || isSent) && (
                    <>
                      <Link href={`/invoices/${id}?edit=1`} className="btn btn-secondary !rounded-full !px-4 !py-2 text-center shrink-0">
                        Edit Invoice
                      </Link>
                      {invoice.generatedPdfPath && (
                        <a
                          className="btn btn-secondary !rounded-full !px-4 !py-2 text-center shrink-0"
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invoices/${id}/download`}
                          target="_blank"
                        >
                          Download
                        </a>
                      )}
                      {!isSent ? (
                        <button className="btn btn-secondary !rounded-full !px-4 !py-2 shrink-0" onClick={markAsSent}>
                          Mark Sent
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shrink-0">
                          Sent
                        </span>
                      )}
                    </>
                  )}
                  {isExtracting && (
                    <button className="btn btn-secondary !rounded-full !px-4 !py-2 shrink-0" disabled>
                      Extracting…
                    </button>
                  )}
                  {isFailed && (
                    <>
                      <button className="btn btn-secondary !rounded-full !px-4 !py-2 shrink-0" onClick={retryExtraction}>
                        Retry
                      </button>
                      <Link href={`/invoices/${id}/review`} className="btn btn-secondary !rounded-full !px-4 !py-2 text-center shrink-0">
                        Manual Entry
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {actionMsg && <span className="text-xs text-slate-600">{actionMsg}</span>}
                  {statusBadge(invoice.status)}
                  {isSent && <span className="badge bg-green-100 text-green-700">Completed</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/35 flex justify-end">
          <div className="h-full w-full md:max-w-3xl bg-white border-l border-[var(--border)] flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold">{viewer.title}</h3>
              <button className="btn btn-secondary" onClick={() => setViewer(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-slate-100">
              {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(viewer.ext) ? (
                <img src={viewer.url} alt={viewer.title} className="w-full h-full object-contain" />
              ) : (
                <iframe title={viewer.title} src={viewer.url} className="w-full h-full border-0" />
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
