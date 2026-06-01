'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function AdminExtractions(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{api('/admin/extraction-runs').then(setRows);},[]);return <main className="p-8"><h1 className="text-2xl">Admin Extractions</h1><ul>{rows.slice(0,100).map(r=><li key={r.id}>{r.status} {r.errorMessage || 'OK'}</li>)}</ul></main>}
