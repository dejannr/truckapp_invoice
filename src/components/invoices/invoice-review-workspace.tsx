'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const sections = [
  { title: 'Broker Information', fields: ['brokerName', 'brokerEmail', 'brokerPhone', 'brokerAddressLine1', 'brokerCity', 'brokerState', 'brokerZipCode'] },
  { title: 'Carrier Information', fields: ['driverName', 'truckNumber', 'trailerNumber', 'paymentTerms'] },
  { title: 'Load Details', fields: ['loadNumber', 'bolNumber', 'poNumber', 'commodity', 'weightLbs', 'miles'] },
  { title: 'Pickup / Delivery', fields: ['pickupDate', 'pickupCity', 'pickupState', 'deliveryDate', 'deliveryCity', 'deliveryState'] },
  { title: 'Charges', fields: ['lineHaulAmount', 'fuelSurchargeAmount', 'accessorialAmount', 'detentionAmount', 'lumperAmount', 'otherAmount', 'totalAmount'] },
  { title: 'Notes', fields: ['notes'] },
];

const requiredFields = new Set(['brokerName', 'totalAmount', 'pickupCity', 'pickupDate', 'deliveryCity', 'deliveryDate']);
const sectionKeys: Record<string, string> = {
  'Broker Information': 'brokerInfo',
  'Carrier Information': 'carrierInfo',
  'Load Details': 'loadDetails',
  'Pickup / Delivery': 'pickupDelivery',
  Charges: 'charges',
  Notes: 'notes',
};

function toLabel(field: string) {
  const acronymMap: Record<string, string> = { po: 'PO', bol: 'BOL' };
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((part, idx) => {
      const lower = part.toLowerCase();
      if (acronymMap[lower]) return acronymMap[lower];
      if (idx > 0 && lower === 'id') return 'ID';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function fieldMissing(invoice: any, field: string) {
  if (field === 'pickupCity' || field === 'pickupDate') return !(invoice.pickupCity || invoice.pickupDate);
  if (field === 'deliveryCity' || field === 'deliveryDate') return !(invoice.deliveryCity || invoice.deliveryDate);
  return !invoice[field];
}

function moneyLabel(value: any) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
}

type Props = {
  invoice: any;
  setInvoice: (next: any) => void;
  onSave: (invoice: any) => Promise<any>;
  onGenerate: (invoice: any) => Promise<any>;
  compact?: boolean;
  showActions?: boolean;
};

export function InvoiceReviewWorkspace({ invoice, setInvoice, onSave, onGenerate, compact = false, showActions = true }: Props) {
  const [message, setMessage] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [draft, setDraft] = useState<any>(invoice);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(invoice);
    setSaveState('saved');
    setMessage('');
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, [invoice.id]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const missing = useMemo(() => {
    const list = ['brokerName', 'totalAmount'].filter((f) => fieldMissing(invoice, f));
    if (!(invoice.pickupCity || invoice.pickupDate)) list.push('pickupCity or pickupDate');
    if (!(invoice.deliveryCity || invoice.deliveryDate)) list.push('deliveryCity or deliveryDate');
    return list;
  }, [invoice]);
  const firstMissingSection = useMemo(() => {
    return sections.find((section) => section.fields.some((field) => {
      if (requiredFields.has(field)) return fieldMissing(invoice, field);
      if (section.title === 'Pickup / Delivery') return !((invoice.pickupCity || invoice.pickupDate) && (invoice.deliveryCity || invoice.deliveryDate));
      return false;
    }))?.title || null;
  }, [invoice]);

  const canGenerate = missing.length === 0;
  const confidence = invoice?.extractionRuns?.[0]?.extractedJson?.confidence || {};

  const fieldConfidence = (sectionTitle: string, field: string) => {
    const sectionConfidence = confidence?.[sectionKeys[sectionTitle]];
    const value = confidence?.[field] ?? sectionConfidence;
    if (typeof value !== 'number') return null;
    return value;
  };

  const persist = async (nextDraft: any) => {
    try {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      const saved = await onSave(nextDraft);
      if (saved) {
        setDraft(saved);
        setInvoice(saved);
      }
      setSaveState('saved');
      setMessage('Saved');
    } catch (e: any) {
      setSaveState('error');
      setMessage(e?.message || 'Save failed');
    }
  };

  const generate = async () => {
    try {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setMessage('');
      const saved = await onSave(draft);
      if (saved) {
        setDraft(saved);
        setInvoice(saved);
      }
      const generated = await onGenerate(saved || draft);
      if (generated) setInvoice(generated);
      setMessage('Invoice generated');
    } catch (e: any) {
      const missingFields = e?.missingFields;
      if (Array.isArray(missingFields) && missingFields.length) {
        setMessage(`Invoice cannot be generated yet. Missing: ${missingFields.map((f: string) => toLabel(f)).join(', ')}`);
        return;
      }
      setMessage(e?.message || 'Generation failed');
    }
  };

  return (
    <div className={`card ${compact ? '' : ''}`}>
      <div className="card-header flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{compact ? 'Review Details' : 'Review Extracted Data'}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            {canGenerate ? 'All required details are complete.' : 'Fix the missing fields before generating the invoice.'}
          </p>
        </div>
        <div className="text-right">
          <span className={`badge ${canGenerate ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {canGenerate ? 'Ready' : 'Needs attention'}
          </span>
          <p className="mt-1 text-[11px] text-[var(--muted)] uppercase tracking-wide">
            {saveState === 'saving' && 'Saving...'}
            {saveState === 'saved' && 'Saved'}
            {saveState === 'error' && 'Could not save'}
          </p>
        </div>
      </div>

      <div className="card-body space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Broker</p>
            <p className="font-medium mt-1 truncate">{invoice.brokerName || 'Not provided'}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Load</p>
            <p className="font-medium mt-1 truncate">{invoice.loadNumber || 'Not provided'}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Route</p>
            <p className="font-medium mt-1 truncate">{(invoice.pickupCity || 'Not provided') + ' → ' + (invoice.deliveryCity || 'Not provided')}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Total</p>
            <p className="font-medium mt-1">{moneyLabel(invoice.totalAmount)}</p>
          </div>
        </div>

        {!canGenerate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <strong>Missing:</strong> {missing.map(toLabel).join(', ')}
          </div>
        )}

        <div className="space-y-3">
          {sections.map((section) => {
            const sectionMissing = section.fields.filter((field) => requiredFields.has(field) ? fieldMissing(invoice, field) : false);
            const open = section.title === firstMissingSection;
            return (
              <details key={section.title} open={open} className="rounded-2xl border border-[var(--border)] bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{section.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {sectionMissing.length === 0 ? 'Complete' : `${sectionMissing.length} required field${sectionMissing.length === 1 ? '' : 's'} need attention`}
                    </p>
                  </div>
                  <span className={`badge ${sectionMissing.length === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sectionMissing.length === 0 ? 'Complete' : 'Needs attention'}
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.fields.map((field) => {
                      const isRequired = requiredFields.has(field);
                      const isPairField = field === 'pickupCity' || field === 'pickupDate' || field === 'deliveryCity' || field === 'deliveryDate';
                      const isMissing = fieldMissing(invoice, field) && (isRequired || isPairField);
                      const type = field.toLowerCase().includes('date') ? 'date' : field.toLowerCase().includes('amount') || ['weightLbs', 'miles'].includes(field) ? 'number' : 'text';
                      const fieldScore = fieldConfidence(section.title, field);
                      const showCheck = fieldScore != null && fieldScore < 0.75 && !isMissing;
                      return (
                        <div key={field}>
                          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                            {toLabel(field)} {isRequired && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type={type}
                            inputMode={type === 'number' ? 'decimal' : undefined}
                            className={`input ${isMissing ? 'border-amber-300 bg-amber-50' : ''}`}
                            value={draft[field] ?? ''}
                            onChange={(e) => {
                              const next = { ...draft, [field]: e.target.value };
                              setDraft(next);
                              setInvoice(next);
                              setSaveState('saving');
                              if (saveTimer.current) clearTimeout(saveTimer.current);
                              saveTimer.current = setTimeout(() => {
                                persist(next);
                              }, 900);
                            }}
                            placeholder={`Enter ${toLabel(field)}`}
                            />
                          {showCheck && (
                            <p className="mt-1 text-[11px] text-amber-700">
                              Check this field
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>

        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
            <button className="btn btn-secondary" onClick={() => persist(draft)}>Save Draft</button>
            {canGenerate && <button className="btn btn-primary" onClick={generate}>Generate Invoice PDF</button>}
          </div>
        )}

        {showActions && message && <p className="text-sm text-blue-700">{message}</p>}
      </div>
    </div>
  );
}
