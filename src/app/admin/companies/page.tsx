'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

const plans = ['FREE', 'STARTER', 'PRO', 'UNLIMITED'];

export default function AdminCompaniesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

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
        monthlyInvoiceLimitOverride: row.monthlyInvoiceLimitOverride === '' ? null : Number(row.monthlyInvoiceLimitOverride),
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
                <th>Override</th>
                <th>Effective Limit</th>
                <th>Month Usage</th>
                <th>Users</th>
                <th>Invoices</th>
                <th>Prefix</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <select className="select" value={row.plan} onChange={(e) => setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, plan: e.target.value } : item)))}>
                      {plans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="input" value={row.monthlyInvoiceLimitOverride ?? ''} placeholder="None" onChange={(e) => setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, monthlyInvoiceLimitOverride: e.target.value } : item)))} />
                  </td>
                  <td>{row.effectiveLimit === Number.MAX_SAFE_INTEGER ? 'Unlimited' : row.effectiveLimit}</td>
                  <td>{row.currentMonthInvoices}</td>
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
