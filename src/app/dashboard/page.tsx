'use client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';
import { statusBadge } from '@/lib/ui';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api('/dashboard/summary').then(setData).catch(() => setData({ recentInvoices: [] })); }, []);
  const kpis = data ? [
    ['Total Invoices', data.totalInvoices],
    ['Unpaid Amount', `$${Number(data.totalRevenue || 0).toFixed(2)}`],
    ['Paid Amount', '$0.00'],
    ['Drafts', data.needsReviewInvoices],
    ['Remaining Free Invoices', `${Math.max((data.currentMonthLimit || 0) - (data.currentMonthInvoices || 0), 0)}`],
  ] : [];

  return <AppShell title="Dashboard">
    {!data ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card"><div className="card-body"><div className="skeleton h-20" /></div></div>)}</div> : <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">{kpis.map(([k, v]) => <div key={k as string} className="card"><div className="card-body"><p className="text-xs text-[var(--muted)]">{k}</p><p className="text-2xl font-semibold mt-2">{v as any}</p></div></div>)}</div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="card-header flex justify-between"><h3 className="font-semibold">Recent Invoices</h3><Link className="text-sm text-blue-600" href="/invoices">View all</Link></div>
          <div className="card-body table-wrap">{data.recentInvoices?.length ? <table className="table"><thead><tr><th>Invoice</th><th>Broker</th><th>Load</th><th>Amount</th><th>Status</th></tr></thead><tbody>{data.recentInvoices.map((r: any) => <tr key={r.id}><td>{r.invoiceNumber || r.id.slice(0, 8)}</td><td>{r.brokerName || '-'}</td><td>{r.loadNumber || '-'}</td><td>${r.totalAmount || 0}</td><td>{statusBadge(r.status)}</td></tr>)}</tbody></table> : <p className="text-sm text-[var(--muted)]">No invoices yet.</p>}</div>
        </div>
        <div className="space-y-4">
          <div className="card"><div className="card-header"><h3 className="font-semibold">Document Processing</h3></div><div className="card-body text-sm"><p className="text-blue-700">Extracting: {data.currentMonthInvoices || 0}</p><p className="text-amber-600">Needs review: {data.needsReviewInvoices || 0}</p><p className="text-red-600">Failed: {data.failedInvoices || 0}</p></div></div>
          <div className="card"><div className="card-header"><h3 className="font-semibold">Quick Actions</h3></div><div className="card-body"><Link href="/invoices/new" className="btn btn-primary w-full text-center">Create New Invoice</Link></div></div>
        </div>
      </div>
    </>}
  </AppShell>;
}
