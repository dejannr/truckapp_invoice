'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';
import { statusBadge } from '@/lib/ui';
import { Eye } from 'lucide-react';

export default function InvoicesPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  useEffect(() => {
    setStatusFilter(new URLSearchParams(window.location.search).get('status')?.toUpperCase() || '');
  }, []);
  useEffect(() => { api('/invoices').then(setRows).catch(() => setRows([])); }, []);
  const filtered = (rows || []).filter((r) => {
    const matchesQuery = (r.invoiceNumber || '').toLowerCase().includes(q.toLowerCase()) || (r.brokerName || '').toLowerCase().includes(q.toLowerCase());
    const matchesStatus = !statusFilter || (r.status || '').toUpperCase() === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const filters = [
    { label: 'All', href: '/invoices', active: !statusFilter },
    { label: 'Needs Review', href: '/invoices?status=NEEDS_REVIEW', active: statusFilter === 'NEEDS_REVIEW' },
    { label: 'Drafts', href: '/invoices?status=UPLOADED', active: statusFilter === 'UPLOADED' },
    { label: 'Generated', href: '/invoices?status=GENERATED', active: statusFilter === 'GENERATED' },
    { label: 'Failed', href: '/invoices?status=FAILED', active: statusFilter === 'FAILED' },
  ];
  return <AppShell title="Invoices">
    <div className="card">
      <div className="card-header flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <h3 className="font-semibold">Invoice History</h3>
          <input className="input max-w-sm" placeholder="Search invoice or broker" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.label}
              href={filter.href}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${filter.active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-[var(--border)] bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="card-body table-wrap">{rows === null ? <div className="skeleton h-40" /> : filtered.length ? <table className="table"><thead><tr><th>Invoice #</th><th>Broker/Customer</th><th>Load #</th><th>Pickup → Delivery</th><th>Amount</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td><Link href={`/invoices/${r.id}`} className="text-blue-700 font-semibold hover:underline">{r.invoiceNumber || r.id.slice(0, 8)}</Link></td><td>{r.brokerName || '-'}</td><td>{r.loadNumber || '-'}</td><td>{(r.pickupCity || '-') + ' → ' + (r.deliveryCity || '-')}</td><td>${r.totalAmount || 0}</td><td>{statusBadge(r.status)}</td><td>{new Date(r.createdAt).toLocaleDateString()}</td><td><Link href={`/invoices/${r.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[13px] font-medium hover:bg-slate-50"><Eye size={14} /> View Details</Link></td></tr>)}</tbody></table> : <p className="text-sm text-[var(--muted)]">No invoices found.</p>}</div>
    </div>
  </AppShell>;
}
