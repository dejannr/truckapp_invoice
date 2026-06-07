'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';
import { statusBadge } from '@/lib/ui';

function money(value: any) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function dateLabel(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function usageTone(percent: number) {
  if (percent >= 100) return 'bg-red-600';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-blue-600';
}

function chartTone(percent: number) {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-blue-600';
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    api('/dashboard/summary')
      .then(setData)
      .catch(() =>
        setData({
          recentInvoices: [],
          totalInvoiceValue: 0,
          currentMonthInvoices: 0,
          currentMonthLimit: Number.MAX_SAFE_INTEGER,
          remainingInvoices: Number.MAX_SAFE_INTEGER,
          needsReviewInvoices: 0,
          failedInvoices: 0,
        }),
      );
  }, []);

  const summary = data || {};
  const currentMonthInvoices = Number(summary.currentMonthInvoices || 0);
  const currentMonthLimit = Number(summary.currentMonthLimit || 0);
  const remainingInvoices = Number(summary.remainingInvoices || Math.max(currentMonthLimit - currentMonthInvoices, 0));
  const usagePercent = currentMonthLimit && currentMonthLimit !== Number.MAX_SAFE_INTEGER ? Math.min((currentMonthInvoices / currentMonthLimit) * 100, 100) : 0;
  const limitReached = currentMonthLimit !== Number.MAX_SAFE_INTEGER && currentMonthInvoices >= currentMonthLimit;
  const recentInvoices = summary.recentInvoices || [];
  const needsReview = Number(summary.needsReviewInvoices || 0);
  const failed = Number(summary.failedInvoices || 0);
  const attentionCount = needsReview + failed;
  const weeklyInvoiceValue = Array.isArray(summary.weeklyInvoiceValue) ? summary.weeklyInvoiceValue : [];
  const weeklyMax = weeklyInvoiceValue.reduce((max: number, item: any) => Math.max(max, Number(item.value || 0)), 0) || 1;

  const kpis = [
    { label: 'Total Invoice Value', value: money(summary.totalInvoiceValue) },
    { label: 'Invoices This Month', value: currentMonthInvoices },
    { label: 'Needs Review', value: needsReview, tone: needsReview > 0 ? 'text-amber-700' : 'text-slate-900' },
    { label: 'Problems', value: failed, tone: failed > 0 ? 'text-red-700' : 'text-slate-900' },
  ];

  return (
    <AppShell title="Dashboard">
      {data === null ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <div className="card-body space-y-3">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-8 w-32" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="card xl:col-span-2">
              <div className="card-body">
                <div className="skeleton h-64" />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="skeleton h-44" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((item) => (
              <div key={item.label} className="card">
                <div className="card-body">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${item.tone || 'text-slate-900'}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Monthly Usage</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm text-[var(--muted)]">Invoices used</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {currentMonthInvoices} / {currentMonthLimit === Number.MAX_SAFE_INTEGER ? 'Unlimited' : currentMonthLimit}
                  </p>
                </div>
                <div className="h-2 rounded-full border border-[var(--border)] bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${usageTone(usagePercent)}`}
                    style={{ width: currentMonthLimit === Number.MAX_SAFE_INTEGER ? '18%' : `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <p className={`text-sm font-medium ${limitReached ? 'text-red-700' : usagePercent >= 80 ? 'text-amber-700' : 'text-slate-700'}`}>
                  {currentMonthLimit === Number.MAX_SAFE_INTEGER
                    ? 'Unlimited plan'
                    : limitReached
                      ? 'Monthly invoice limit reached.'
                      : remainingInvoices <= 1
                        ? '1 invoice remaining this month.'
                        : `${remainingInvoices} invoices remaining this month.`}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Needs Attention</h3>
              </div>
              <div className="card-body">
                {attentionCount ? (
                  <div className="space-y-2">
                    {needsReview > 0 && (
                      <Link
                        href="/invoices?status=NEEDS_REVIEW"
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 hover:bg-white transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-900">{needsReview} need review</span>
                        <ArrowRight size={15} className="text-[var(--muted)]" />
                      </Link>
                    )}
                    {failed > 0 && (
                      <Link
                        href="/invoices?status=FAILED"
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 hover:bg-white transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-900">{failed} problem{failed === 1 ? '' : 's'}</span>
                        <ArrowRight size={15} className="text-[var(--muted)]" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
                    <p className="font-medium text-slate-900">No invoices need attention.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Invoice Value This Month</h3>
              </div>
              <div className="card-body">
                {weeklyInvoiceValue.length ? (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-[var(--muted)]">Current month total</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{money(summary.monthInvoiceValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Invoices</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{currentMonthInvoices}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 items-end gap-2 h-40">
                      {weeklyInvoiceValue.map((item: any) => {
                        const percent = Math.max((Number(item.value || 0) / weeklyMax) * 100, Number(item.value || 0) > 0 ? 8 : 0);
                        return (
                          <div key={item.week} className="flex h-full flex-col justify-end gap-2">
                            <div className="relative flex-1 flex items-end">
                              <div
                                className={`w-full rounded-t-xl ${chartTone(percent)} transition-all`}
                                style={{ height: `${percent}%` }}
                                title={`Week ${item.week}: ${money(item.value)} (${item.count} invoices)`}
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-slate-700">W{item.week}</p>
                              <p className="text-[11px] text-[var(--muted)]">{item.count}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
                    <p className="text-sm font-medium text-slate-900">No chart data yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Recent Invoices</h3>
              </div>
              <Link className="text-sm font-medium text-blue-700 hover:underline" href="/invoices">
                View all
              </Link>
            </div>
            <div className="card-body">
              {recentInvoices.length ? (
                <>
                  <div className="hidden md:block table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Broker</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentInvoices.map((row: any) => (
                          <tr key={row.id} className="cursor-pointer hover:bg-[var(--surface-2)]" onClick={() => router.push(`/invoices/${row.id}`)}>
                            <td className="font-semibold text-slate-900">{row.invoiceNumber || row.id.slice(0, 8)}</td>
                            <td>{row.brokerName || '-'}</td>
                            <td>{money(row.totalAmount)}</td>
                            <td>{statusBadge(row.status)}</td>
                            <td>{dateLabel(row.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {recentInvoices.map((row: any) => (
                      <button
                        key={row.id}
                        onClick={() => router.push(`/invoices/${row.id}`)}
                        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-left hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{row.invoiceNumber || row.id.slice(0, 8)}</p>
                            <p className="mt-1 text-sm text-[var(--muted)]">{row.brokerName || '-'}</p>
                          </div>
                          {statusBadge(row.status)}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--muted)]">{dateLabel(row.createdAt)}</span>
                          <span className="font-semibold text-slate-900">{money(row.totalAmount)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-8 text-center">
                  <p className="text-base font-semibold text-slate-900">No invoices yet</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Created invoices will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
