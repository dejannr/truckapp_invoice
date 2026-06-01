import { AppShell } from '@/components/layout/app-shell';

export default function CustomersPage() {
  return <AppShell title="Customers / Brokers"><div className="card"><div className="card-header"><h3 className="font-semibold">Brokers</h3></div><div className="card-body"><p className="text-sm text-[var(--muted)]">Customer/Broker management is prepared in UI for the next phase.</p></div></div></AppShell>;
}
