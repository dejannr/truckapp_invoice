'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

export default function AdminExtractionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api('/admin/extraction-runs').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <AppShell title="Admin Extractions">
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Extraction Runs</h3>
        </div>
        <div className="card-body table-wrap">
          <table className="table table-fixed">
            <colgroup>
              <col className="w-28" />
              <col className="w-[30%]" />
              <col className="w-40" />
              <col className="w-[32%]" />
              <col className="w-24" />
            </colgroup>
            <thead>
              <tr>
                <th>Status</th>
                <th>Invoice</th>
                <th>Model</th>
                <th>Error</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((row) => (
                <tr key={row.id}>
                  <td>{row.status}</td>
                  <td>{row.invoiceId}</td>
                  <td>{row.model || '-'}</td>
                  <td>
                    <div className="max-w-full truncate text-sm text-[var(--muted)]" title={row.errorMessage || ''}>
                      {row.errorMessage || '-'}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/extractions/${row.id}`}
                      className="btn btn-secondary px-3 py-1.5 text-xs whitespace-nowrap"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
