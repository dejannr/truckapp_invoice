'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

export default function AdminExtractionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  useEffect(() => {
    api('/admin/extraction-runs').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <AppShell title="Admin Extractions">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h3 className="font-semibold">Extraction Runs</h3>
          </div>
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
                {rows.slice(0, 200).map((row) => (
                  <tr key={row.id} onClick={() => setSelected(row)} className="cursor-pointer">
                    <td>{row.status}</td>
                    <td>{row.invoiceId}</td>
                    <td>{row.model || '-'}</td>
                    <td>{row.errorMessage || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Details</h3>
          </div>
          <div className="card-body">
            {selected ? <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(selected, null, 2)}</pre> : <p className="text-sm text-[var(--muted)]">Select an extraction run.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
