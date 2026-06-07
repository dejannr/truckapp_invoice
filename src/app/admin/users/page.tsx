'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api('/admin/users').then(setRows).catch(() => setRows([]));
  }, []);

  const toggleUser = async (id: string, disabled: boolean) => {
    await api(`/admin/users/${id}/disable`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled }),
    });
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, disabledAt: disabled ? new Date().toISOString() : null } : row)));
    setMsg(disabled ? 'User disabled' : 'User enabled');
  };

  return (
    <AppShell title="Admin Users">
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Users</h3>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Company</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/admin/companies/${row.companyId || ''}`} className="text-slate-900 font-semibold hover:underline">{row.email}</Link></td>
                  <td>{[row.firstName, row.lastName].filter(Boolean).join(' ') || '-'}</td>
                  <td>{row.role}</td>
                  <td>{row.company?.name || '-'}</td>
                  <td>{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '-'}</td>
                  <td>{row.disabledAt ? 'Disabled' : 'Active'}</td>
                  <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td>
                    {row.disabledAt ? (
                      <button className="btn btn-secondary" onClick={() => toggleUser(row.id, false)}>Enable</button>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => toggleUser(row.id, true)}>Disable</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-sm text-[var(--muted)]">No users found.</p>}
          {msg && <p className="text-sm text-blue-700 mt-3">{msg}</p>}
        </div>
      </div>
    </AppShell>
  );
}
