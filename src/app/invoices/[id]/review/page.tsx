'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

const sections = {
  'Broker Information': ['brokerName', 'brokerEmail', 'brokerPhone', 'brokerAddressLine1', 'brokerCity', 'brokerState', 'brokerZipCode'],
  'Carrier Information': ['driverName', 'truckNumber', 'trailerNumber', 'paymentTerms'],
  'Load Details': ['loadNumber', 'bolNumber', 'poNumber', 'commodity', 'weightLbs', 'miles'],
  'Pickup / Delivery': ['pickupDate', 'pickupCity', 'pickupState', 'deliveryDate', 'deliveryCity', 'deliveryState'],
  Charges: ['lineHaulAmount', 'fuelSurchargeAmount', 'accessorialAmount', 'detentionAmount', 'lumperAmount', 'otherAmount', 'totalAmount'],
  Documents: ['notes'],
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [toast, setToast] = useState('');
  useEffect(() => { api(`/invoices/${id}`).then(setInvoice); }, [id]);
  if (!invoice) return <AppShell title="Review Extracted Data"><div className="skeleton h-96" /></AppShell>;

  const missing = ['brokerName', 'totalAmount'].filter((f) => !invoice[f]);
  return <AppShell title="Review Extracted Data">
    <div className="mb-4 card"><div className="card-body"><p className="font-medium">Extraction completed. Please review the fields before generating the invoice.</p><p className="text-sm text-[var(--muted)]">AI extraction can make mistakes, especially with scanned or low-quality documents.</p>{missing.length > 0 && <p className="text-sm text-amber-700 mt-2">Missing: {missing.join(', ')}</p>}</div></div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{Object.entries(sections).map(([title, fields]) => <div key={title} className="card"><div className="card-header flex justify-between"><h3 className="font-semibold">{title}</h3><span className="text-xs text-[var(--muted)]">Confidence: {invoice.extractionRuns?.[0]?.extractedJson?.confidence?.loadDetails ?? '-'}</span></div><div className="card-body grid grid-cols-1 md:grid-cols-2 gap-2">{(fields as string[]).map((f) => <input key={f} className={`input ${!invoice[f] ? 'border-amber-300 bg-amber-50' : ''}`} placeholder={f} value={invoice[f] ?? ''} onChange={(e) => setInvoice({ ...invoice, [f]: e.target.value })} />)}</div></div>)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-secondary" onClick={async () => { await api(`/invoices/${id}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoice) }); setToast('Changes saved'); }}>Save Changes</button><button className="btn btn-primary" onClick={async () => { try { await api(`/invoices/${id}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoice) }); await api(`/invoices/${id}/generate-pdf`, { method: 'POST' }); setToast('Invoice generated successfully'); } catch (e: any) { setToast(e.message || 'Generation failed'); } }}>Generate Invoice</button></div>
    {toast && <p className="mt-2 text-sm text-blue-700">{toast}</p>}
  </AppShell>;
}
