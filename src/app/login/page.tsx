'use client';
import { Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="card w-full max-w-md">
        <div className="card-body space-y-4">
          <div className="flex items-center gap-2 font-semibold"><Truck size={18} /> FleetInvoice Pro</div>
          <h1 className="text-2xl font-semibold">Sign In</h1>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" onClick={async () => { try { const res = await api('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); localStorage.setItem('token', res.accessToken); if (res.user?.company?.name) localStorage.setItem('companyName', res.user.company.name); router.push('/dashboard'); } catch (e: any) { setError(e.message || 'Invalid credentials'); } }}>Login</button>
          <p className="text-sm text-[var(--muted)]">No account? <Link href="/register" className="text-blue-600">Create one</Link></p>
        </div>
      </div>
    </main>
  );
}
