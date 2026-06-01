import Link from 'next/link';
export default function Admin(){return <main className="p-8"><h1 className="text-2xl">Admin</h1><p><Link href="/admin/companies">Companies</Link> | <Link href="/admin/invoices">Invoices</Link> | <Link href="/admin/extractions">Extractions</Link></p></main>}
