'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function AdminCompanies(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{api('/admin/companies').then(setRows);},[]);return <main className="p-8"><h1 className="text-2xl">Admin Companies</h1><ul>{rows.map(r=><li key={r.id}>{r.name} - {r.plan}</li>)}</ul></main>}
