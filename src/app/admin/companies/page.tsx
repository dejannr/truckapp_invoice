'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

const plans = ['FREE', 'STARTER', 'PRO', 'UNLIMITED'];

export default function AdminCompaniesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const usagePercent = (row: any) => {
    if (!row.effectiveLimit || row.effectiveLimit === Number.MAX_SAFE_INTEGER) return 0;
    return Math.min((Number(row.currentMonthInvoices || 0) / Number(row.effectiveLimit || 1)) * 100, 100);
  };

  const usageTone = (percent: number) => {
    if (percent >= 100) return 'bg-red-600';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-green-600';
  };

  useEffect(() => {
    api('/admin/companies').then(setRows).catch(() => setRows([]));
  }, []);

  const updateCompany = async (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    await api(`/admin/companies/${id}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: row.plan,
        invoicePrefix: row.invoicePrefix,
      }),
    });
    setMsg(`Updated ${row.name}`);
  };

  return (
    <AppShell title="Admin Companies">
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Companies</h3>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Plan</th>
                <th>Usage / Limit</th>
                <th>Users</th>
                <th>Invoices</th>
                <th>Prefix</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/admin/companies/${row.id}`} className="text-slate-900 font-semibold hover:underline">{row.name}</Link></td>
                  <td>
                    <select className="select" value={row.plan} onChange={(e) => setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, plan: e.target.value } : item)))}>
                      {plans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                  </td>
                  <td className="min-w-64">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{row.currentMonthInvoices} / {row.effectiveLimit === Number.MAX_SAFE_INTEGER ? 'Unlimited' : row.effectiveLimit}</div>
                      {row.effectiveLimit !== Number.MAX_SAFE_INTEGER ? (
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-[var(--border)]">
                          <div className={`h-full ${usageTone(usagePercent(row))}`} style={{ width: `${usagePercent(row)}%` }} />
                        </div>
                      ) : (
                        <div className="h-2 rounded-full bg-slate-100 border border-[var(--border)]" />
                      )}
                    </div>
                  </td>
                  <td>{row._count?.users ?? 0}</td>
                  <td>{row._count?.invoices ?? 0}</td>
                  <td>
                    <input className="input" value={row.invoicePrefix || ''} onChange={(e) => setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, invoicePrefix: e.target.value } : item)))} />
                  </td>
                  <td><button className="btn btn-secondary" onClick={() => updateCompany(row.id)}>Save</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-sm text-[var(--muted)]">No companies found.</p>}
          {msg && <p className="text-sm text-blue-700 mt-3">{msg}</p>}
        </div>
      </div>
    </AppShell>
  );
}
