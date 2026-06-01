'use client';
import { Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { setCookie } from '@/lib/session';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="card w-full max-w-lg">
        <div className="card-body space-y-4">
          <div className="flex items-center gap-2 font-semibold"><Truck size={18} /> FleetInvoice Pro</div>
          <h1 className="text-2xl font-semibold">Create Account</h1>
          {Object.keys(form).map((k) => <input key={k} className="input" type={k === 'password' ? 'password' : 'text'} placeholder={k} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" onClick={async () => { try { const res = await api('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setCookie('auth_token', res.accessToken, 7); if (form.companyName) setCookie('company_name', form.companyName, 7); router.push('/dashboard'); } catch (e: any) { setError(e.message || 'Registration failed'); } }}>Create Account</button>
          <p className="text-sm text-[var(--muted)]">Already registered? <Link href="/login" className="text-blue-600">Login</Link></p>
        </div>
      </div>
    </main>
  );
}
