'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
export function Sidebar() {
  const router = useRouter();
  return <aside className="w-64 min-h-screen bg-slate-900 text-white p-4 space-y-2"><p className="font-bold">Truck App</p><Link href="/dashboard">Dashboard</Link><br/><Link href="/invoices">Invoices</Link><br/><Link href="/invoices/new">Create Invoice</Link><br/><Link href="/settings/company">Company Settings</Link><br/><Link href="/admin">Admin</Link><br/><button onClick={async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); }}>Logout</button></aside>;
}
