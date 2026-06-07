export function statusBadge(status?: string) {
  const s = (status || '').toUpperCase();
  const labelMap: Record<string, string> = {
    UPLOADED: 'Draft',
    EXTRACTING: 'Processing',
    NEEDS_REVIEW: 'Needs Review',
    GENERATED: 'Generated',
    SENT: 'Sent',
    FAILED: 'Failed',
    VOIDED: 'Voided',
    PAID: 'Paid',
  };
  const cls = s === 'GENERATED' || s === 'PAID' || s === 'SENT'
    ? 'bg-green-100 text-green-700'
    : s === 'NEEDS_REVIEW'
      ? 'bg-amber-100 text-amber-700'
      : s === 'EXTRACTING'
        ? 'bg-blue-100 text-blue-700'
        : s === 'FAILED' || s === 'OVERDUE'
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-700';
  return <span className={`badge ${cls}`}>{labelMap[s] || s || 'Draft'}</span>;
}
