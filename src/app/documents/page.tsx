import { AppShell } from '@/components/layout/app-shell';

export default function DocumentsPage() {
  return <AppShell title="Documents"><div className="card"><div className="card-header"><h3 className="font-semibold">Document Management</h3></div><div className="card-body"><p className="text-sm text-[var(--muted)]">No standalone documents yet. Uploaded Rate Cons and BOLs are attached to invoice records.</p></div></div></AppShell>;
}
