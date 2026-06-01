'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

export default function NewInvoicePage() {
  const router = useRouter();
  const [rateConFile, setRateConFile] = useState<File | null>(null);
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [demoData, setDemoData] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  return <AppShell title="Create Invoice">
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="card xl:col-span-2"><div className="card-header"><h3 className="font-semibold">Upload Rate Con + BOL</h3></div><div className="card-body space-y-4"><p className="text-sm text-[var(--muted)]">Upload the Rate Confirmation and BOL for one completed load. We will extract billing details and prepare an invoice for review.</p><div><p className="text-sm mb-1">Rate Confirmation</p><input className="input" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setRateConFile(e.target.files?.[0] || null)} /></div><div><p className="text-sm mb-1">Bill of Lading</p><input className="input" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setBolFile(e.target.files?.[0] || null)} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={demoData} onChange={(e) => setDemoData(e.target.checked)} /> Demo Data</label><p className="text-xs text-[var(--muted)]">When enabled, extraction is skipped and sample trucking invoice data is inserted for testing.</p>{msg && <p className="text-sm text-red-600">{msg}</p>}<button className="btn btn-primary" disabled={busy} onClick={async () => { if (!rateConFile || !bolFile) return setMsg('Please upload both files.'); setBusy(true); const fd = new FormData(); fd.append('rateConFile', rateConFile); fd.append('bolFile', bolFile); fd.append('demoData', String(demoData)); try { const res = await api('/invoices/upload', { method: 'POST', body: fd }); router.push(`/invoices/${res.invoiceId}`); } catch (e: any) { if (e?.statusCode === 401) { router.push('/login'); return; } setMsg(e.message || 'Upload failed'); } finally { setBusy(false); } }}>{busy ? 'Uploading...' : 'Start Extraction'}</button></div></div>
      <div className="card"><div className="card-header"><h3 className="font-semibold">Accepted Files</h3></div><div className="card-body text-sm text-[var(--muted)]"><p>Max size: 10MB per file</p><p>Formats: PDF, PNG, JPG, JPEG</p><p className="mt-3 text-amber-600">PDF extraction is best supported in MVP.</p></div></div>
    </div>
  </AppShell>;
}
