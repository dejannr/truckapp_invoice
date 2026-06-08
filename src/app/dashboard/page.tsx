'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { UColumnChart, UStatusBars } from '@/components/charts/u-charts';
import { api } from '@/lib/api';

type DashboardSummary = {
  recentInvoices: any[];
  totalInvoices: number;
  totalInvoiceValue: number;
  monthInvoiceValue: number;
  currentMonthInvoices: number;
  currentMonthLimit: number;
  remainingInvoices: number;
  needsReviewInvoices: number;
  failedInvoices: number;
  extractingInvoices: number;
  uploadedInvoices: number;
  generatedInvoices: number;
  sentInvoices: number;
  weeklyInvoiceValue: Array<{ week: number; label: string; count: number; value: number }>;
  statusBreakdown: Array<{ key: string; label: string; count: number; href: string }>;
};

function money(value: any) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function shortDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function monthLabel(value = new Date()) {
  return value.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function dashboardStatusLabel(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'UPLOADED') return 'Draft';
  if (s === 'EXTRACTING') return 'Processing';
  if (s === 'NEEDS_REVIEW') return 'Needs Review';
  if (s === 'GENERATED') return 'Generated';
  if (s === 'SENT') return 'Sent';
  if (s === 'FAILED') return 'Problem';
  return 'Draft';
}

function dashboardStatusTone(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'UPLOADED') return 'bg-slate-400';
  if (s === 'EXTRACTING') return 'bg-blue-500';
  if (s === 'NEEDS_REVIEW') return 'bg-amber-500';
  if (s === 'GENERATED') return 'bg-green-500';
  if (s === 'SENT') return 'bg-green-600';
  if (s === 'FAILED') return 'bg-red-500';
  return 'bg-slate-400';
}

function dashboardRowAction(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'NEEDS_REVIEW') return 'Review';
  if (s === 'FAILED') return 'Resolve';
  if (s === 'UPLOADED') return 'Continue';
  if (s === 'GENERATED') return 'Mark Sent';
  if (s === 'SENT') return 'Open';
  return 'Open';
}

function dashboardRowActionTone(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'NEEDS_REVIEW') return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100';
  if (s === 'FAILED') return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100';
  if (s === 'UPLOADED') return 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
  if (s === 'EXTRACTING') return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
  if (s === 'GENERATED') return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
  if (s === 'SENT') return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
  return 'border-[var(--border)] bg-white text-slate-700 hover:bg-slate-50';
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api('/dashboard/summary')
      .then(setData)
      .catch(() =>
        setData({
          recentInvoices: [],
          totalInvoices: 0,
          totalInvoiceValue: 0,
          monthInvoiceValue: 0,
          currentMonthInvoices: 0,
          currentMonthLimit: Number.MAX_SAFE_INTEGER,
          remainingInvoices: Number.MAX_SAFE_INTEGER,
          needsReviewInvoices: 0,
          failedInvoices: 0,
          extractingInvoices: 0,
          uploadedInvoices: 0,
          generatedInvoices: 0,
          sentInvoices: 0,
          weeklyInvoiceValue: [],
          statusBreakdown: [],
        }),
      );
  }, []);

  const summary = data || null;
  const currentMonthInvoices = Number(summary?.currentMonthInvoices || 0);
  const currentMonthLimit = Number(summary?.currentMonthLimit || 0);
  const remainingInvoices = Number(summary?.remainingInvoices ?? Math.max(currentMonthLimit - currentMonthInvoices, 0));
  const usagePercent = currentMonthLimit && currentMonthLimit !== Number.MAX_SAFE_INTEGER ? Math.min((currentMonthInvoices / currentMonthLimit) * 100, 100) : 0;
  const limitReached = currentMonthLimit !== Number.MAX_SAFE_INTEGER && currentMonthInvoices >= currentMonthLimit;
  const totalInvoices = Number(summary?.totalInvoices || 0);
  const totalInvoiceValue = Number(summary?.totalInvoiceValue || 0);
  const needsReview = Number(summary?.needsReviewInvoices || 0);
  const failed = Number(summary?.failedInvoices || 0);
  const uploaded = Number(summary?.uploadedInvoices || 0);
  const generated = Number(summary?.generatedInvoices || 0);
  const recentInvoices = summary?.recentInvoices || [];
  const weeklyInvoiceValue = Array.isArray(summary?.weeklyInvoiceValue) ? summary!.weeklyInvoiceValue : [];
  const activeWeeks = weeklyInvoiceValue.filter((item) => Number(item.count || 0) > 0);

  const attentionRows = useMemo(() => {
    return [
      { key: 'FAILED', label: 'Failed processing', count: failed, href: '/invoices?status=FAILED', action: 'Resolve', tone: 'bg-red-500' },
      { key: 'NEEDS_REVIEW', label: 'Invoices need review', count: needsReview, href: '/invoices?status=NEEDS_REVIEW', action: 'Review', tone: 'bg-amber-500' },
      { key: 'UPLOADED', label: 'Drafts incomplete', count: uploaded, href: '/invoices?status=UPLOADED', action: 'Continue', tone: 'bg-slate-400' },
      { key: 'GENERATED', label: 'Generated not sent', count: generated, href: '/invoices?status=GENERATED', action: 'Mark Sent', tone: 'bg-green-500' },
    ].filter((row) => row.count > 0);
  }, [failed, generated, needsReview, uploaded]);

  const statusRows = useMemo(() => {
    const ordered = ['FAILED', 'NEEDS_REVIEW', 'EXTRACTING', 'UPLOADED', 'GENERATED', 'SENT'];
    const byKey = new Map((summary?.statusBreakdown || []).map((item) => [item.key, item]));
    return ordered
      .map((key) => {
        const item = byKey.get(key);
        if (!item || Number(item.count || 0) <= 0) return null;
        return {
          key,
          label: key === 'FAILED' ? 'Problem' : dashboardStatusLabel(key),
          count: Number(item.count || 0),
          href: item.href,
          toneClass: dashboardStatusTone(key),
        };
      })
      .filter(Boolean) as Array<{ key: string; label: string; count: number; href: string; toneClass: string }>;
  }, [summary?.statusBreakdown]);

  const chartItems = weeklyInvoiceValue.map((item) => ({
    key: `week-${item.week}`,
    label: item.label,
    value: Number(item.value || 0),
    count: Number(item.count || 0),
  }));

  const chartHasUsefulData = activeWeeks.length > 1;
  const showCharts = chartHasUsefulData || statusRows.length > 0;

  const kpis = [
    {
      label: 'Total Invoice Value',
      value: money(totalInvoiceValue),
      subtext: `${totalInvoices} invoices tracked`,
      accent: 'bg-blue-500',
      valueTone: 'text-slate-950',
    },
    {
      label: 'Invoices This Month',
      value: currentMonthInvoices,
      subtext: `Created in ${monthLabel()}`,
      accent: 'bg-slate-300',
      valueTone: 'text-slate-950',
    },
    {
      label: 'Needs Review',
      value: needsReview,
      subtext: needsReview > 0 ? 'Open reviews' : 'No review work',
      accent: needsReview > 0 ? 'bg-amber-500' : 'bg-slate-200',
      valueTone: needsReview > 0 ? 'text-amber-700' : 'text-slate-950',
      href: needsReview > 0 ? '/invoices?status=NEEDS_REVIEW' : '',
    },
    {
      label: 'Problems',
      value: failed,
      subtext: failed > 0 ? 'Needs attention' : 'No problems',
      accent: failed > 0 ? 'bg-red-500' : 'bg-slate-200',
      valueTone: failed > 0 ? 'text-red-700' : 'text-slate-950',
      href: failed > 0 ? '/invoices?status=FAILED' : '',
    },
  ];

  return (
    <AppShell title="">
      {data === null ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="skeleton h-5 w-44" />
              <div className="skeleton h-8 w-72" />
            </div>
            <div className="skeleton h-11 w-44 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <div className="card-body space-y-3 py-4">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-10 w-32" />
                  <div className="skeleton h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-body space-y-4 py-4">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
            <div className="card">
              <div className="card-body space-y-3 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-4">
              <div className="skeleton h-5 w-44" />
              <div className="mt-4 skeleton h-56" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Invoice activity for {monthLabel()}.</p>
            </div>
            <div className="flex w-full flex-col items-start gap-1 lg:w-auto lg:items-end">
              <button
                className={`btn ${limitReached ? 'btn-secondary opacity-50 pointer-events-none' : 'btn-primary'} w-full lg:w-auto`}
                onClick={() => {
                  if (!limitReached) router.push('/invoices/new');
                }}
                disabled={limitReached}
              >
                {limitReached ? 'Limit reached' : 'Create Invoice'}
              </button>
              {limitReached ? (
                <p className="text-xs text-red-700">Monthly invoice limit reached.</p>
              ) : (
                <p className="text-xs text-[var(--muted)]">{currentMonthInvoices} of {currentMonthLimit === Number.MAX_SAFE_INTEGER ? 'unlimited' : currentMonthLimit} used.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((item) => {
              const clickable = Boolean(item.href);
              const Comp: any = clickable ? Link : 'div';
              return (
                <Comp key={item.label} href={item.href || undefined} className={`card block overflow-hidden ${clickable ? 'hover:bg-slate-50 transition-colors' : ''}`}>
                  <div className={`h-0.5 w-full ${item.accent}`} />
                  <div className="card-body py-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.label}</p>
                    <p className={`mt-2 text-3xl font-semibold ${item.valueTone}`}>{item.value}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{item.subtext}</p>
                  </div>
                </Comp>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Monthly Usage</h3>
              </div>
              <div className="card-body py-4 space-y-3">
                {currentMonthLimit === Number.MAX_SAFE_INTEGER ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4">
                    <p className="text-sm text-[var(--muted)]">Invoices created this month</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{currentMonthInvoices}</p>
                    <p className="mt-1 text-sm font-medium text-green-700">Unlimited plan</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-sm text-[var(--muted)]">{currentMonthInvoices} of {currentMonthLimit} invoices used</p>
                      <p className="text-sm font-semibold text-slate-950">{remainingInvoices} remaining</p>
                    </div>
                    <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${usagePercent >= 100 ? 'bg-red-600' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                    </div>
                    <p className={`text-sm font-medium ${usagePercent >= 100 ? 'text-red-700' : usagePercent >= 80 ? 'text-amber-700' : 'text-slate-700'}`}>
                      {usagePercent >= 100
                        ? 'Monthly invoice limit reached.'
                        : remainingInvoices <= 1
                          ? '1 invoice remaining this month.'
                          : `${remainingInvoices} invoices remaining this month.`}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Needs Attention</h3>
              </div>
              <div className="card-body py-4">
                {attentionRows.length ? (
                  <div className="space-y-1.5">
                    {attentionRows.map((row) => (
                      <Link key={row.key} href={row.href} className="group flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${row.tone}`} />
                          <div>
                            <p className="text-sm font-medium text-slate-950">{row.label}</p>
                            <p className="text-xs text-[var(--muted)]">{row.count} invoices</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-950">{row.count}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${dashboardRowActionTone(row.key)}`}>{row.action}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-5">
                    <p className="font-medium text-slate-950">No invoices need attention.</p>
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
            <div className="card-body py-4">
              {recentInvoices.length ? (
                <>
                  <div className="hidden md:block table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Broker</th>
                          <th className="hidden xl:table-cell">Load #</th>
                          <th className="!text-center">Amount</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentInvoices.map((row: any) => {
                          const action = dashboardRowAction(row.status);
                          return (
                            <tr key={row.id} className="cursor-pointer hover:bg-[var(--surface-2)]" onClick={() => router.push(`/invoices/${row.id}`)}>
                              <td className="font-semibold text-slate-950">{row.invoiceNumber || 'Draft'}</td>
                              <td>{row.brokerName || '-'}</td>
                              <td className="hidden xl:table-cell">{row.loadNumber || '-'}</td>
                              <td className="!text-center font-medium tabular-nums">{money(row.totalAmount)}</td>
                              <td>
                                <span className={`badge ${dashboardStatusTone(row.status)} text-white`}>{dashboardStatusLabel(row.status)}</span>
                              </td>
                              <td>{shortDate(row.createdAt)}</td>
                              <td className="text-right">
                                <button
                                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${dashboardRowActionTone(row.status)}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/invoices/${row.id}`);
                                  }}
                                >
                                  {action}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
                            <p className="font-semibold text-slate-950">{row.invoiceNumber || 'Draft'}</p>
                            <p className="mt-1 text-sm text-[var(--muted)]">{row.brokerName || '-'}</p>
                          </div>
                          <span className={`badge ${dashboardStatusTone(row.status)} text-white`}>{dashboardStatusLabel(row.status)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--muted)]">{shortDate(row.createdAt)}</span>
                          <span className="font-semibold text-slate-950 tabular-nums">{money(row.totalAmount)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-8 text-center">
                  <p className="text-base font-semibold text-slate-950">No invoices yet</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Create your first invoice by uploading a Rate Confirmation and BOL.</p>
                  <Link href="/invoices/new" className="btn btn-primary mt-4">
                    Create Invoice
                  </Link>
                </div>
              )}
            </div>
          </div>

          {showCharts ? (
            <div className="hidden xl:grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)] gap-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold">Invoice Activity</h3>
                </div>
                <div className="card-body py-4">
                  <UColumnChart
                    items={chartItems}
                    currency={money}
                    emptyTitle="Invoice activity will appear after invoices are created."
                    emptyDescription={`${money(totalInvoiceValue)} total invoice value tracked.`}
                    sparseTitle="Invoice activity is still too sparse for a useful trend."
                    sparseDescription={`${currentMonthInvoices} invoices created this month.`}
                  />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold">Invoice Status</h3>
                </div>
                <div className="card-body py-4">
                  {statusRows.length ? (
                    <UStatusBars items={statusRows} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
                      <p className="text-sm font-medium text-slate-950">No status data yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
