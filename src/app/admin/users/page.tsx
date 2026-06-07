'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api('/admin/users').then(setRows).catch(() => setRows([]));
  }, []);

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
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.email}</td>
                  <td>{[row.firstName, row.lastName].filter(Boolean).join(' ') || '-'}</td>
                  <td>{row.role}</td>
                  <td>{row.company?.name || '-'}</td>
                  <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-sm text-[var(--muted)]">No users found.</p>}
        </div>
      </div>
    </AppShell>
  );
}
