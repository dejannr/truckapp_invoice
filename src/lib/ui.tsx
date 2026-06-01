export function statusBadge(status?: string) {
  const s = (status || '').toUpperCase();
  const cls = s === 'GENERATED' || s === 'PAID' ? 'bg-green-100 text-green-700' : s === 'NEEDS_REVIEW' ? 'bg-amber-100 text-amber-700' : s === 'EXTRACTING' || s === 'SENT' ? 'bg-blue-100 text-blue-700' : s === 'FAILED' || s === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';
  return <span className={`badge ${cls}`}>{s || 'DRAFT'}</span>;
}
