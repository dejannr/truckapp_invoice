'use client';

import Link from 'next/link';

export type UColumnChartItem = {
  key: string;
  label: string;
  value: number;
  count: number;
  href?: string;
};

export type UStatusBarItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  toneClass: string;
};

type UColumnChartProps = {
  items: UColumnChartItem[];
  currency: (value: number) => string;
  emptyTitle: string;
  emptyDescription: string;
  sparseTitle: string;
  sparseDescription: string;
  className?: string;
};

export function UColumnChart({ items, currency, emptyTitle, emptyDescription, sparseTitle, sparseDescription, className }: UColumnChartProps) {
  const active = items.filter((item) => Number(item.count || 0) > 0);
  const max = items.reduce((acc, item) => Math.max(acc, Number(item.value || 0)), 0);

  if (!items.length) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
          <p className="text-sm font-medium text-slate-900">{emptyTitle}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  if (active.length <= 1) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-6">
          <p className="text-sm font-medium text-slate-900">{sparseTitle}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{sparseDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-[240px] flex flex-col">
        <div className="grid h-full grid-cols-5 items-end gap-2">
          {items.map((item) => {
            const value = Number(item.value || 0);
            const count = Number(item.count || 0);
            const heightPercent = max > 0 ? Math.max((value / max) * 100, value > 0 ? 12 : 0) : 0;
            const bar = (
              <>
                <div className="relative flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-blue-600 transition-all"
                    style={{ height: `${heightPercent}%` }}
                    title={`${item.label}\n${count} invoices\n${currency(value)}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-700 leading-tight">{item.label}</p>
                  <p className="text-[11px] text-[var(--muted)]">{count}</p>
                </div>
              </>
            );

            return item.href ? (
              <Link key={item.key} href={item.href} className="flex h-full flex-col justify-end gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                {bar}
              </Link>
            ) : (
              <div key={item.key} className="flex h-full flex-col justify-end gap-2 px-1 py-1">
                {bar}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type UStatusBarsProps = {
  items: UStatusBarItem[];
  className?: string;
};

export function UStatusBars({ items, className }: UStatusBarsProps) {
  if (!items.length) {
    return null;
  }

  const max = items.reduce((acc, item) => Math.max(acc, Number(item.count || 0)), 0) || 1;

  return (
    <div className={className}>
      <div className="space-y-1.5">
        {items.map((item) => {
          const percent = Math.max((Number(item.count || 0) / max) * 100, Number(item.count || 0) > 0 ? 12 : 0);
          return (
            <Link key={item.key} href={item.href} className="block rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900 leading-none">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900 leading-none">{item.count}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${item.toneClass}`} style={{ width: `${percent}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
