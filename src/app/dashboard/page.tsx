'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, FileText, Plus, RefreshCw, ShieldAlert, Sparkles, Truck } from 'lucide-react';
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

function routeLabel(row: any) {
  const pickup = row.pickupCity || row.pickupState;
  const delivery = row.deliveryCity || row.deliveryState;
  if (!pickup && !delivery) return '-';
  return `${pickup || '-'} → ${delivery || '-'}`;
}

function rowActionLabel(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'NEEDS_REVIEW') return 'Review';
  if (s === 'FAILED') return 'Resolve';
  if (s === 'EXTRACTING') return 'Processing';
  if (s === 'GENERATED') return 'View';
  if (s === 'SENT') return 'View';
  return 'Open';
}

function rowActionHref(row: any) {
  const s = (row.status || '').toUpperCase();
  if (s === 'NEEDS_REVIEW') return `/invoices/${row.id}`;
  if (s === 'FAILED') return `/invoices/${row.id}`;
  if (s === 'EXTRACTING') return `/invoices/${row.id}`;
  return `/invoices/${row.id}`;
}

function rowActionTone(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'NEEDS_REVIEW') return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100';
  if (s === 'FAILED') return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100';
  if (s === 'EXTRACTING') return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
  if (s === 'GENERATED' || s === 'SENT') return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
  return 'border-[var(--border)] bg-white text-slate-700 hover:bg-slate-50';
}

function toneForUsage(percent: number) {
  if (percent >= 100) return 'bg-red-600';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-green-600';
}

function neutralButtonClass(disabled?: boolean) {
  return `btn ${disabled ? 'btn-secondary opacity-50 pointer-events-none' : 'btn-primary'}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api('/dashboard/summary')
      .then(setData)
      .catch(() => {
        setFailed(true);
        setData({
          recentInvoices: [],
          currentMonthLimit: Number.MAX_SAFE_INTEGER,
          currentMonthInvoices: 0,
          remainingInvoices: Number.MAX_SAFE_INTEGER,
          openInvoiceValue: 0,
          monthInvoiceValue: 0,
          sentInvoices: 0,
          needsReviewInvoices: 0,
          failedInvoices: 0,
          extractingInvoices: 0,
          completedExtractionsToday: 0,
          failedExtractionsToday: 0,
        });
      });
  }, []);

  const summary = data || {};
  const currentMonthInvoices = Number(summary.currentMonthInvoices || 0);
  const currentMonthLimit = Number(summary.currentMonthLimit || 0);
  const remainingInvoices = Number(summary.remainingInvoices || Math.max(currentMonthLimit - currentMonthInvoices, 0));
  const usagePercent = useMemo(() => {
    if (!currentMonthLimit || currentMonthLimit === Number.MAX_SAFE_INTEGER) return 0;
    return Math.min((currentMonthInvoices / currentMonthLimit) * 100, 100);
  }, [currentMonthInvoices, currentMonthLimit]);
  const limitReached = currentMonthLimit !== Number.MAX_SAFE_INTEGER && currentMonthInvoices >= currentMonthLimit;

  const recentInvoices = summary.recentInvoices || [];
  const latestDraft = recentInvoices.find((row: any) => (row.status || '').toUpperCase() === 'NEEDS_REVIEW') || null;
  const hasNeedsReview = Number(summary.needsReviewInvoices || 0) > 0;
  const hasFailed = Number(summary.failedInvoices || 0) > 0;
  const hasProcessing = Number(summary.extractingInvoices || 0) > 0;

  const kpis = [
    {
      label: 'Generated Invoice Value',
      value: money(summary.openInvoiceValue),
      subtext: 'Generated and sent invoices',
      accent: 'text-slate-900',
    },
    {
      label: 'Invoices This Month',
      value: currentMonthInvoices,
      subtext: 'Created in the current billing month',
      accent: 'text-slate-900',
    },
    {
      label: 'Sent This Month',
      value: Number(summary.sentInvoices || 0),
      subtext: 'Finished and delivered invoices',
      accent: 'text-slate-900',
    },
    {
      label: 'Drafts to Complete',
      value: Number(summary.needsReviewInvoices || 0),
      subtext: 'Waiting for review',
      accent: 'text-slate-900',
    },
  ];

  const attentionItems = [
    hasNeedsReview ? { label: `${summary.needsReviewInvoices} invoice${Number(summary.needsReviewInvoices) === 1 ? '' : 's'} need review`, href: '/invoices?status=NEEDS_REVIEW', icon: FileText } : null,
    hasFailed ? { label: `${summary.failedInvoices} extraction${Number(summary.failedInvoices) === 1 ? '' : 's'} failed`, href: '/invoices?status=FAILED', icon: ShieldAlert } : null,
    hasProcessing ? { label: `${summary.extractingInvoices} invoice${Number(summary.extractingInvoices) === 1 ? '' : 's'} processing`, href: '/invoices?status=EXTRACTING', icon: RefreshCw } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: any }>;

  const quickActions = [
    { label: 'Create New Invoice', href: '/invoices/new', icon: Plus, disabled: limitReached },
    latestDraft ? { label: 'Continue Latest Draft', href: `/invoices/${latestDraft.id}`, icon: ArrowRight, disabled: false } : null,
    hasNeedsReview ? { label: 'Review Invoices', href: '/invoices?status=NEEDS_REVIEW', icon: FileText, disabled: false } : null,
    hasFailed ? { label: 'Resolve Failed Extraction', href: '/invoices?status=FAILED', icon: ShieldAlert, disabled: false } : null,
    { label: 'View All Invoices', href: '/invoices', icon: Truck, disabled: false },
  ].filter(Boolean) as Array<{ label: string; href: string; icon: any; disabled: boolean }>;

  const usageMessage =
    currentMonthLimit === Number.MAX_SAFE_INTEGER
      ? 'Unlimited plan active.'
      : limitReached
        ? 'Monthly invoice limit reached.'
        : remainingInvoices <= 1
          ? 'You have 1 invoice remaining this month.'
          : `${remainingInvoices} invoices remaining this month.`;

  const processingRows = [
    {
      label: 'Completed today',
      value: Number(summary.completedExtractionsToday || 0),
      tone: 'text-green-700',
    },
    {
      label: 'Processing now',
      value: Number(summary.extractingInvoices || 0),
      tone: 'text-blue-700',
    },
    {
      label: 'Failed today',
      value: Number(summary.failedExtractionsToday || 0),
      tone: 'text-red-700',
    },
  ];

  return (
    <AppShell title="Dashboard">
      {data === null ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-8 w-64" />
              <div className="skeleton h-4 w-80" />
            </div>
            <div className="skeleton h-11 w-40 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card"><div className="card-body space-y-3"><div className="skeleton h-4 w-28" /><div className="skeleton h-8 w-32" /><div className="skeleton h-4 w-40" /></div></div>)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="card xl:col-span-2"><div className="card-body"><div className="skeleton h-64" /></div></div>
            <div className="space-y-4">
              <div className="card"><div className="card-body"><div className="skeleton h-44" /></div></div>
              <div className="card"><div className="card-body"><div className="skeleton h-32" /></div></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1">
                  {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1">
                  {currentMonthInvoices} used
                </span>
                <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1">
                  {attentionItems.length} needing attention
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--muted)]">Current month summary and work that needs attention.</p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Track invoices, reviews, and monthly usage in one place.
                {failed ? ' Some data could not be loaded, but the dashboard remains usable.' : ''}
              </p>
            </div>
            <button
              className={neutralButtonClass(limitReached)}
              onClick={() => { if (!limitReached) router.push('/invoices/new'); }}
              disabled={limitReached}
            >
              {limitReached ? 'Limit reached' : 'Create Invoice'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((item) => (
              <div key={item.label} className="card">
                <div className="card-body">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${item.accent}`}>{item.value}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.subtext}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-header flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Needs Attention</h3>
                  <p className="text-sm text-[var(--muted)]">Items that need action now.</p>
                </div>
                <span className="badge bg-slate-100 text-slate-700">{attentionItems.length}</span>
              </div>
              <div className="card-body">
                {attentionItems.length ? (
                  <div className="space-y-2">
                    {attentionItems.map(({ label, href, icon: Icon }) => (
                      <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 hover:bg-white transition-colors">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-slate-700">
                          <Icon size={15} />
                        </span>
                        <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
                        <ArrowRight size={15} className="text-[var(--muted)]" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
                    <p className="font-medium text-slate-900">You&apos;re all caught up.</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">There are no invoices waiting for review or processing.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Monthly Usage</h3>
                  <p className="text-sm text-[var(--muted)]">Invoice capacity for this month.</p>
                </div>
                <span className={`badge ${limitReached ? 'bg-red-100 text-red-700' : usagePercent >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {currentMonthLimit === Number.MAX_SAFE_INTEGER ? 'Unlimited' : `${usagePercent.toFixed(0)}%`}
                </span>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-sm text-[var(--muted)]">Invoices used</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {currentMonthInvoices} / {currentMonthLimit === Number.MAX_SAFE_INTEGER ? 'Unlimited' : currentMonthLimit}
                    </p>
                  </div>
                  <div className="mt-3 h-2 rounded-full border border-[var(--border)] bg-slate-100 overflow-hidden">
                    <div className={`h-full ${toneForUsage(usagePercent)}`} style={{ width: currentMonthLimit === Number.MAX_SAFE_INTEGER ? '18%' : `${Math.min(usagePercent, 100)}%` }} />
                  </div>
                  <p className={`mt-3 text-sm font-medium ${limitReached ? 'text-red-700' : usagePercent >= 80 ? 'text-amber-700' : 'text-slate-700'}`}>{usageMessage}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Remaining</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {currentMonthLimit === Number.MAX_SAFE_INTEGER ? '∞' : remainingInvoices}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)]">This month value</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{money(summary.monthInvoiceValue)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Document Processing</h3>
                <p className="text-sm text-[var(--muted)]">Extraction activity for today.</p>
              </div>
              <div className="card-body space-y-3">
                {Number(summary.completedExtractionsToday || 0) || Number(summary.extractingInvoices || 0) || Number(summary.failedExtractionsToday || 0) ? (
                  processingRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                      <p className="text-sm text-slate-700">{row.label}</p>
                      <p className={`text-sm font-semibold ${row.tone}`}>{row.value}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
                    <p className="text-sm font-medium text-slate-900">No processing activity right now.</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">New uploads will appear here while they are being extracted.</p>
                  </div>
                )}
                <div className="pt-1 flex flex-col gap-2">
                  <Link href="/invoices?status=EXTRACTING" className="btn btn-secondary w-full justify-center">
                    View Processing
                  </Link>
                  <Link href="/invoices?status=FAILED" className="btn btn-secondary w-full justify-center">
                    Resolve Failed Extraction
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Recent Invoices</h3>
                <p className="text-sm text-[var(--muted)]">Latest invoices and the next action for each one.</p>
              </div>
              <Link className="text-sm font-medium text-blue-700 hover:underline" href="/invoices">View all</Link>
            </div>
            <div className="card-body">
              {recentInvoices.length ? (
                <>
                  <div className="hidden md:block table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Load</th>
                          <th>Broker</th>
                          <th className="hidden xl:table-cell">Route</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentInvoices.map((row: any) => (
                          <tr
                            key={row.id}
                            className="cursor-pointer hover:bg-[var(--surface-2)]"
                            onClick={() => router.push(`/invoices/${row.id}`)}
                          >
                            <td className="font-semibold text-slate-900">{row.invoiceNumber || row.id.slice(0, 8)}</td>
                            <td>{row.loadNumber || '-'}</td>
                            <td>{row.brokerName || '-'}</td>
                            <td className="hidden xl:table-cell">{routeLabel(row)}</td>
                            <td>{money(row.totalAmount)}</td>
                          <td>{statusBadge(row.status)}</td>
                          <td>{dateLabel(row.createdAt)}</td>
                          <td>
                            <button
                                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${rowActionTone(row.status)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(rowActionHref(row));
                                }}
                              >
                                {rowActionLabel(row.status)}
                              </button>
                            </td>
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
                            <p className="mt-1 text-sm text-[var(--muted)]">{row.brokerName || '-'} · {row.loadNumber || '-'}</p>
                          </div>
                          {statusBadge(row.status)}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--muted)]">{routeLabel(row)}</span>
                          <span className="font-semibold text-slate-900">{money(row.totalAmount)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--muted)]">{dateLabel(row.createdAt)}</span>
                          <span className="font-medium text-blue-700">{rowActionLabel(row.status)}</span>
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Quick Actions</h3>
                <p className="text-sm text-[var(--muted)]">Only the actions that matter right now.</p>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  {quickActions.map(({ label, href, icon: Icon, disabled }) => (
                    <Link
                      key={label}
                      href={href}
                      className={`flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-3 transition-colors ${disabled ? 'bg-slate-50 text-[var(--muted)] pointer-events-none opacity-50' : 'bg-[var(--surface-2)] hover:bg-white text-slate-900'}`}
                    >
                      <span className="flex items-center gap-3 text-sm font-medium">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-slate-700">
                          <Icon size={15} />
                        </span>
                        {label}
                      </span>
                      <ArrowRight size={15} className="text-[var(--muted)]" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Workflow Notes</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Sparkles size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Upload one completed load at a time</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Use the Rate Confirmation and Bill of Lading for the same load.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Clock3 size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Review comes before generation</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Fix missing fields first so invoice generation stays clean.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Truck size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Keep the workflow moving</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">The dashboard should help you finish invoices, not just list them.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
