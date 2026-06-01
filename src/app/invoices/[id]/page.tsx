'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';
import { statusBadge } from '@/lib/ui';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
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

  return <AppShell title="Invoice Detail">
    {!invoice ? <div className="skeleton h-60" /> : <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <div className="card"><div className="card-header flex justify-between"><h3 className="font-semibold">Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}</h3>{statusBadge(invoice.status)}</div><div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><p><span className="text-[var(--muted)]">Broker:</span> {invoice.brokerName || '-'}</p><p><span className="text-[var(--muted)]">Load #:</span> {invoice.loadNumber || '-'}</p><p><span className="text-[var(--muted)]">Route:</span> {(invoice.pickupCity || '-') + ' → ' + (invoice.deliveryCity || '-')}</p><p><span className="text-[var(--muted)]">Amount:</span> ${invoice.totalAmount || 0}</p></div></div>
        {invoice.status === 'EXTRACTING' && <div className="card"><div className="card-body"><p className="text-blue-700 font-medium">Extracting invoice data...</p><p className="text-sm text-[var(--muted)]">This can take a short moment. You can stay on this page while we process your documents.</p></div></div>}
        {invoice.status === 'FAILED' && <div className="card"><div className="card-body"><p className="text-red-700 font-medium">Extraction failed</p><p className="text-sm text-[var(--muted)]">{invoice.extractionRuns?.[0]?.errorMessage || 'The extraction job failed. Please verify document quality and try again.'}</p></div></div>}
        <div className="card"><div className="card-header"><h3 className="font-semibold">Invoice Preview</h3></div><div className="card-body"><div className="bg-white border border-[var(--border)] rounded-xl p-5 min-h-80"><h2 className="text-xl font-semibold mb-3">Invoice Preview</h2><p className="text-sm text-[var(--muted)]">Broker: {invoice.brokerName || '-'}</p><p className="text-sm text-[var(--muted)]">Total: ${invoice.totalAmount || 0}</p></div></div></div>
      </div>
      <div className="space-y-4">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Actions</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Manage this invoice from one place.</p>
          </div>
          <div className="card-body space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Primary</p>
              {invoice.generatedPdfPath ? (
                <a
                  className="btn btn-primary w-full text-center block"
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invoices/${id}/download`}
                  target="_blank"
                >
                  Download PDF
                </a>
              ) : (
                <button className="btn btn-primary w-full opacity-60 cursor-not-allowed" disabled>
                  PDF Not Available Yet
                </button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Workflow</p>
              <button className="btn btn-secondary w-full">Mark as Sent</button>
              <Link href={`/invoices/${id}/review`} className="btn btn-secondary w-full text-center block">Edit Data</Link>
            </div>
          </div>
        </div>
      </div>
    </div>}
  </AppShell>;
}
