"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarRange, CreditCard, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type LineItem = { id: string; service_date: string; description: string; amount_cents: number; status: string; source_type: string };
type Adjustment = { id: string; amount_cents: number; reason: string; created_at: string };
type Invoice = { id: string; office_id: string; period_start: string; period_end: string; status: string; subtotal_cents: number; credits_cents: number; total_cents: number; provider_invoice_id: string | null; charged_at: string | null; paid_at: string | null; failed_at: string | null; invoice_number: string | null; emailed_at: string | null; offices: { name: string; communication_email: string | null } | { name: string; communication_email: string | null }[] | null; billing_line_items: LineItem[]; billing_adjustments: Adjustment[] };
type Unbilled = { id: string; office_id: string; service_date: string; description: string; amount_cents: number; source_type: string; offices: { name: string } | { name: string }[] | null };

function money(cents: number) { return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format((cents || 0) / 100); }
function officeName(value: Invoice["offices"] | Unbilled["offices"]) { const office = Array.isArray(value) ? value[0] : value; return office?.name || "Dental Office"; }
function monthBounds(value: string) { const [year, month] = value.split("-").map(Number); const start = `${value}-01`; const end = new Date(year, month, 0).toISOString().slice(0, 10); return { start, end }; }

export default function AdminBillingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [unbilled, setUnbilled] = useState<Unbilled[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [creditInvoiceId, setCreditInvoiceId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const api = async (body?: unknown) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch("/api/admin/billing", { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Billing request failed.");
    return result;
  };

  const load = async () => {
    setError("");
    try {
      const result = await api();
      setInvoices(result.invoices || []);
      setUnbilled(result.unbilled || []);
    } catch (value) { setError(value instanceof Error ? value.message : "Billing could not be loaded."); }
    finally { setChecking(false); }
  };

  useEffect(() => { void load(); }, []);

  const generate = async () => {
    setBusy("generate"); setError(""); setNotice("");
    try {
      const { start, end } = monthBounds(month);
      const result = await api({ action: "generate", periodStart: start, periodEnd: end });
      setInvoices(result.invoices || []);
      setNotice(`${result.generated || 0} monthly invoice${result.generated === 1 ? "" : "s"} prepared.`);
      await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Invoices could not be generated."); }
    finally { setBusy(""); }
  };

  const addCredit = async () => {
    if (!creditInvoiceId) return;
    const amountCents = Math.round(Number(creditAmount) * 100);
    setBusy(`credit:${creditInvoiceId}`); setError(""); setNotice("");
    try {
      const result = await api({ action: "credit", invoiceId: creditInvoiceId, amountCents, reason: creditReason });
      setInvoices(result.invoices || []);
      setCreditInvoiceId(null); setCreditAmount(""); setCreditReason("");
      setNotice("Credit added and invoice total recalculated.");
    } catch (value) { setError(value instanceof Error ? value.message : "Credit could not be added."); }
    finally { setBusy(""); }
  };

  const charge = async (invoiceId: string) => {
    setBusy(`charge:${invoiceId}`); setError(""); setNotice("");
    try {
      const result = await api({ action: "charge", invoiceId });
      setInvoices(result.invoices || []);
      setNotice("Invoice charged successfully and receipt email processed.");
    } catch (value) { setError(value instanceof Error ? value.message : "Invoice charge failed."); }
    finally { setBusy(""); }
  };

  const totals = useMemo(() => ({ unbilled: unbilled.reduce((s, x) => s + Number(x.amount_cents || 0), 0), open: invoices.filter((i) => i.status === "open" || i.status === "failed").reduce((s, x) => s + Number(x.total_cents || 0), 0), paid: invoices.filter((i) => i.status === "paid").reduce((s, x) => s + Number(x.total_cents || 0), 0) }), [unbilled, invoices]);

  if (checking) return <main className="grid min-h-screen place-items-center bg-white"><div className="text-center"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="mx-auto h-16 w-auto" priority /><p className="mt-4 text-sm font-extrabold text-[#002757]">Opening monthly billing…</p></div></main>;

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><button onClick={() => router.push("/admin/overview")} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-[#002757]"><ArrowLeft size={18}/></button><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-10 w-auto" priority /></div><div className="inline-flex items-center gap-2 rounded-xl bg-[#edf3fa] px-3 py-2 text-xs font-black text-[#002757]"><ShieldCheck size={15}/> Admin Billing</div></div></header>

    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#04A62F]">Unified monthly billing</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#002757]">Invoices & Charges</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Temporary staffing charges and DentalJobs Candidate Unlocks are combined into one monthly office invoice. Review, add credits, then charge the saved card.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><CalendarRange size={17} className="text-[#4285F4]"/><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-sm font-black text-[#002757] outline-none"/></label><button onClick={() => void generate()} disabled={busy === "generate"} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#04A62F] px-5 text-sm font-black text-white shadow-sm disabled:opacity-50"><FileText size={17}/>{busy === "generate" ? "Generating…" : "Generate Monthly Invoices"}</button></div></div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}{notice && <p className="mt-4 rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27]">{notice}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Unbilled activity</p><p className="mt-2 text-2xl font-black text-[#002757]">{money(totals.unbilled)}</p><p className="mt-1 text-xs text-slate-500">{unbilled.length} charge item{unbilled.length === 1 ? "" : "s"}</p></div><div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-amber-600">Ready / failed invoices</p><p className="mt-2 text-2xl font-black text-[#002757]">{money(totals.open)}</p></div><div className="rounded-2xl border border-[#04A62F]/25 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-[#017f27]">Paid invoices</p><p className="mt-2 text-2xl font-black text-[#002757]">{money(totals.paid)}</p></div></div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-[#002757]">Monthly invoices</h2><p className="mt-1 text-sm text-slate-500">Review every charge before processing the saved office card.</p></div><button onClick={() => void load()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-[#002757]"><RefreshCw size={17}/></button></div><div className="mt-4 grid gap-4">{invoices.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm font-semibold text-slate-500">No invoices yet. Choose a month and generate invoices from unbilled activity.</div> : invoices.map((invoice) => <article key={invoice.id} className="overflow-hidden rounded-2xl border border-slate-200"><div className="flex flex-col gap-3 bg-[#f8fafc] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-[11px] font-black uppercase text-[#002757]">{invoice.invoice_number || "Draft invoice"}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${invoice.status === "paid" ? "bg-[#eaf8ee] text-[#017f27]" : invoice.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{invoice.status}</span></div><h3 className="mt-2 text-lg font-black text-[#002757]">{officeName(invoice.offices)}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{invoice.period_start} → {invoice.period_end}</p></div><div className="text-left sm:text-right"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Total</p><p className="text-2xl font-black text-[#002757]">{money(invoice.total_cents)}</p>{invoice.credits_cents > 0 && <p className="text-xs font-bold text-[#017f27]">Includes {money(invoice.credits_cents)} credit</p>}</div></div><div className="p-4 sm:p-5"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-[11px] font-black uppercase tracking-wide text-slate-400"><th className="pb-2">Date</th><th className="pb-2">Charge</th><th className="pb-2">Source</th><th className="pb-2 text-right">Amount</th></tr></thead><tbody>{(invoice.billing_line_items || []).map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-2.5 font-semibold text-slate-500">{item.service_date}</td><td className="py-2.5 font-bold text-slate-700">{item.description}</td><td className="py-2.5"><span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${item.source_type === "dentaljobs_unlock" ? "bg-[#eef4ff] text-[#245FB8]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{item.source_type === "dentaljobs_unlock" ? "DentalJobs" : "Temp Shift"}</span></td><td className="py-2.5 text-right font-black text-[#002757]">{money(item.amount_cents)}</td></tr>)}{(invoice.billing_adjustments || []).map((credit) => <tr key={credit.id} className="border-b border-slate-100 bg-[#f7fcf8]"><td className="py-2.5"></td><td className="py-2.5 font-bold text-[#017f27]">Credit: {credit.reason}</td><td className="py-2.5 text-xs font-black text-[#017f27]">Adjustment</td><td className="py-2.5 text-right font-black text-[#017f27]">-{money(credit.amount_cents)}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs font-semibold text-slate-500">Subtotal {money(invoice.subtotal_cents)} · Credits {money(invoice.credits_cents)}{invoice.paid_at ? ` · Paid ${new Date(invoice.paid_at).toLocaleString()}` : ""}</div>{invoice.status !== "paid" && invoice.status !== "void" && <div className="flex flex-wrap gap-2"><button onClick={() => setCreditInvoiceId(invoice.id)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-[#002757]">Add Credit</button><button onClick={() => void charge(invoice.id)} disabled={busy === `charge:${invoice.id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white shadow-sm disabled:opacity-50"><CreditCard size={15}/>{busy === `charge:${invoice.id}` ? "Charging…" : "Charge Saved Card"}</button></div>}</div></div></article>)}</div></section>

      {unbilled.length > 0 && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-black text-[#002757]">Unbilled charge queue</h2><div className="mt-3 grid gap-2">{unbilled.map((item) => <div key={item.id} className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-slate-700">{officeName(item.offices)} · {item.description}</p><p className="text-xs text-slate-500">{item.service_date} · {item.source_type === "dentaljobs_unlock" ? "DentalJobs" : "Temp Shift"}</p></div><p className="font-black text-[#002757]">{money(item.amount_cents)}</p></div>)}</div></section>}
    </section>

    {creditInvoiceId && <div className="fixed inset-0 z-50 grid place-items-center bg-[#002757]/60 p-4"><button className="absolute inset-0" onClick={() => setCreditInvoiceId(null)} aria-label="Close"/><section className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black text-[#002757]">Add invoice credit</h2><p className="mt-1 text-sm text-slate-500">The original charge remains visible. This credit is recorded separately for a complete audit trail.</p><label className="mt-4 block"><span className="text-sm font-black text-slate-700">Credit amount (CAD)</span><input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} inputMode="decimal" placeholder="25.00" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-bold outline-none focus:border-[#4285F4]"/></label><label className="mt-4 block"><span className="text-sm font-black text-slate-700">Reason</span><input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="Courtesy credit, no-show adjustment…" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-bold outline-none focus:border-[#4285F4]"/></label><div className="mt-5 flex justify-end gap-2"><button onClick={() => setCreditInvoiceId(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-600">Cancel</button><button onClick={() => void addCredit()} disabled={busy.startsWith("credit:")} className="rounded-xl bg-[#04A62F] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">Apply Credit</button></div></section></div>}
  </main>;
}
