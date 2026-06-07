'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

export default function AdminPage() {
  const [summary, setSummary] = useState<any>(null);
  useEffect(() => {
    api('/admin/summary').then(setSummary).catch(() => setSummary({ companies: 0, users: 0, invoices: 0, failedExtractions: 0 }));
  }, []);

  return (
    <AppShell title="Admin Panel">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {[
          ['Companies', summary?.companies ?? '-'],
          ['Users', summary?.users ?? '-'],
          ['Invoices', summary?.invoices ?? '-'],
          ['Failed Extractions', summary?.failedExtractions ?? '-'],
        ].map(([label, value]) => (
          <div key={label as string} className="card">
            <div className="card-body">
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <p className="text-2xl font-semibold mt-2">{value as any}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ['/admin/companies', 'Manage Companies'],
          ['/admin/users', 'Manage Users'],
          ['/admin/invoices', 'View All Invoices'],
          ['/admin/extractions', 'Extraction Debug'],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="card">
            <div className="card-body">
              <p className="font-semibold">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
