'use client';
import { Bell, Building2, CircleUserRound, FileSpreadsheet, FileUp, LayoutDashboard, Menu, Search, Settings, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getCookie } from '@/lib/session';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices/new', label: 'Create Invoice', icon: FileUp },
  { href: '/invoices', label: 'Invoices', icon: FileSpreadsheet },
  { href: '/documents', label: 'Documents', icon: Truck },
  { href: '/customers', label: 'Customers/Brokers', icon: Building2 },
  { href: '/settings/company', label: 'Settings', icon: Settings },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState('Your Company');
  useEffect(() => {
    const stored = getCookie('company_name');
    if (stored) setCompany(stored);
  }, []);

  const activeHref =
    nav
      .filter((item) => path === item.href || path?.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href || '';

  return (
    <div className="app-shell flex">
      <aside className={`fixed z-30 top-0 left-0 h-screen w-72 bg-[var(--sidebar)] p-4 transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2 text-white font-semibold px-2 py-3"><Truck size={18} /> FleetInvoice Pro</div>
        <nav className="mt-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`sidebar-nav-link ${activeHref === href ? 'active' : ''}`} onClick={() => setOpen(false)}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <button className="mt-6 sidebar-nav-link w-full" onClick={async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); }}>Logout</button>
      </aside>

      <main className="flex-1 min-w-0 md:ml-72">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/95 backdrop-blur">
          <div className="px-4 md:px-6 py-3 flex items-center gap-3">
            <button className="md:hidden btn btn-secondary" onClick={() => setOpen(!open)}><Menu size={16} /></button>
            <div>
              <p className="text-sm text-[var(--muted)]">Operations</p>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2 bg-[var(--surface-2)] text-sm text-[var(--muted)]"><Search size={15} /> Search loads, brokers, invoices...</div>
              <button className="btn btn-secondary"><Bell size={15} /></button>
              <div className="hidden md:flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><CircleUserRound size={16} /> {company}</div>
            </div>
          </div>
        </header>
        <section className="p-4 md:p-6">{children}</section>
      </main>
    </div>
  );
}
