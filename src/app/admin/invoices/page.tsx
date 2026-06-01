'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function AdminInvoices(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{api('/admin/invoices').then(setRows);},[]);return <main className="p-8"><h1 className="text-2xl">Admin Invoices</h1><ul>{rows.slice(0,100).map(r=><li key={r.id}>{r.id} {r.status} {r.company?.name}</li>)}</ul></main>}
