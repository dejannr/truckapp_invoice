'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

const plans = ['FREE', 'STARTER', 'PRO', 'UNLIMITED'];

export default function AdminCompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api(`/admin/companies/${companyId}`).then(setData).catch(() => setData(null));
  }, [companyId]);

  const save = async () => {
    await api(`/admin/companies/${companyId}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: data.plan,
        invoicePrefix: data.invoicePrefix,
      }),
    });
    const fresh = await api(`/admin/companies/${companyId}`);
    setData(fresh);
    setMsg('Company updated');
  };

  return (
    <AppShell title="Company Details">
      {!data ? (
        <div className="skeleton h-80" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">{data.name}</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                    <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Plan</p>
                    <p className="font-semibold mt-1">{data.plan}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                    <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Usage</p>
                    <p className="font-semibold mt-1">{data.currentMonthInvoices} / {data.effectiveLimit === Number.MAX_SAFE_INTEGER ? 'Unlimited' : data.effectiveLimit}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                    <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Remaining</p>
                    <p className="font-semibold mt-1">{data.remainingInvoices}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
                    <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Prefix</p>
                    <p className="font-semibold mt-1">{data.invoicePrefix}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="text-[var(--muted)]">Prefix:</span> {data.invoicePrefix}</p>
                    <p><span className="text-[var(--muted)]">Created:</span> {new Date(data.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p><span className="text-[var(--muted)]">Users:</span> {data.users.length}</p>
                    <p><span className="text-[var(--muted)]">Invoices:</span> {data.invoices.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Users</h3></div>
              <div className="card-body table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user: any) => (
                      <tr key={user.id}>
                        <td>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Recent Invoices</h3></div>
              <div className="card-body table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoiceNumber || invoice.id.slice(0, 8)}</td>
                        <td>{invoice.status}</td>
                        <td>${invoice.totalAmount || 0}</td>
                        <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Recent Extractions</h3></div>
              <div className="card-body table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Invoice</th>
                      <th>Model</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentExtractions.map((run: any) => (
                      <tr key={run.id}>
                        <td>{run.status}</td>
                        <td>{run.invoice?.invoiceNumber || run.invoiceId.slice(0, 8)}</td>
                        <td>{run.model || '-'}</td>
                        <td>{run.errorMessage || 'OK'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Admin Actions</h3></div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-xs text-[var(--muted)] mb-1">Plan</p>
                <select className="select" value={data.plan} onChange={(e) => setData({ ...data, plan: e.target.value })}>
                  {plans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)] mb-1">Invoice Prefix</p>
                <input className="input" value={data.invoicePrefix || ''} onChange={(e) => setData({ ...data, invoicePrefix: e.target.value })} />
              </div>
              <button className="btn btn-secondary w-full" onClick={save}>Save Changes</button>
              {msg && <p className="text-sm text-blue-700">{msg}</p>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
