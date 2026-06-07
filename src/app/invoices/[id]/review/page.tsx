'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { InvoiceReviewWorkspace } from '@/components/invoices/invoice-review-workspace';
import { api } from '@/lib/api';

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    api(`/invoices/${id}`).then(setInvoice).catch(() => setInvoice(null));
  }, [id]);

  const save = async (draft: any) => {
    return api(`/invoices/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
  };

  const generate = async () => {
    return api(`/invoices/${id}/generate-pdf`, { method: 'POST' });
  };

  return (
    <AppShell title="Review Extracted Data">
      {!invoice ? (
        <div className="skeleton h-96" />
      ) : (
        <InvoiceReviewWorkspace invoice={invoice} setInvoice={setInvoice} onSave={save} onGenerate={generate} />
      )}
    </AppShell>
  );
}
