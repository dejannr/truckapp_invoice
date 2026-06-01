'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

const fields = ['name', 'dotNumber', 'mcNumber', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'zipCode', 'invoicePrefix', 'paymentTermsDefault'];

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [saved, setSaved] = useState('');
  useEffect(() => { api('/company/me').then(setCompany).catch(() => setCompany({})); }, []);
  return <AppShell title="Settings / Company Profile">
    <div className="card">
      <div className="card-header"><h3 className="font-semibold">Company Profile</h3></div>
      <div className="card-body">{!company ? <div className="skeleton h-48" /> : <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{fields.map((f) => <input key={f} className="input" placeholder={f} value={company[f] ?? ''} onChange={(e) => setCompany({ ...company, [f]: e.target.value })} />)}</div>
        <button className="btn btn-primary mt-4" onClick={async () => { await api('/company/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(company) }); setSaved('Company settings saved'); }}>Save Settings</button>
        {saved && <p className="text-sm text-green-700 mt-2">{saved}</p>}
      </>}</div>
    </div>
  </AppShell>;
}
