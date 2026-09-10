import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { escapeEmailHtml, renderDentalShiftEmail } from "@/lib/email";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

async function clients(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || !serviceRoleKey) return null;
  const token = authorization.slice(7);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData } = await requestClient.auth.getUser(token);
  if (!userData.user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  return { admin, userId: userData.user.id };
}

async function recalcInvoice(admin: any, invoiceId: string) {
  const [{ data: items }, { data: credits }] = await Promise.all([
    admin.from("billing_line_items").select("amount_cents").eq("invoice_id", invoiceId).eq("status", "invoiced"),
    admin.from("billing_adjustments").select("amount_cents").eq("invoice_id", invoiceId),
  ]);
  const subtotal = (items ?? []).reduce((sum: number, row: any) => sum + Number(row.amount_cents || 0), 0);
  const creditTotal = (credits ?? []).reduce((sum: number, row: any) => sum + Number(row.amount_cents || 0), 0);
  const total = Math.max(0, subtotal - creditTotal);
  await admin.from("billing_invoices").update({ subtotal_cents: subtotal, credits_cents: creditTotal, total_cents: total, updated_at: new Date().toISOString() }).eq("id", invoiceId);
  return { subtotal, creditTotal, total };
}

async function loadInvoices(admin: any) {
  const { data: invoices, error } = await admin.from("billing_invoices").select("id,office_id,period_start,period_end,status,subtotal_cents,credits_cents,total_cents,provider_invoice_id,charged_at,paid_at,failed_at,invoice_number,emailed_at,created_at,offices(name,communication_email),billing_line_items(id,service_date,description,amount_cents,status,source_type),billing_adjustments(id,amount_cents,reason,created_at)").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return invoices ?? [];
}

export async function GET(request: Request) {
  const ctx = await clients(request);
  if (!ctx) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const invoices = await loadInvoices(ctx.admin);
    const { data: unbilled } = await ctx.admin.from("billing_line_items").select("id,office_id,service_date,description,amount_cents,source_type,offices(name)").eq("status", "unbilled").order("service_date", { ascending: false });
    return NextResponse.json({ invoices, unbilled: unbilled ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Billing could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await clients(request);
  if (!ctx) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as any;
  const action = body?.action;
  const admin = ctx.admin;

  try {
    if (action === "generate") {
      const periodStart = String(body.periodStart || "");
      const periodEnd = String(body.periodEnd || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) return NextResponse.json({ error: "Choose a valid billing period." }, { status: 400 });
      const { data: items, error } = await admin.from("billing_line_items").select("id,office_id").eq("status", "unbilled").gte("service_date", periodStart).lte("service_date", periodEnd);
      if (error) throw error;
      const officeIds = [...new Set((items ?? []).map((row: any) => row.office_id))] as string[];
      let generated = 0;
      for (const officeId of officeIds) {
        const { data: existing } = await admin.from("billing_invoices").select("id,status").eq("office_id", officeId).eq("period_start", periodStart).eq("period_end", periodEnd).maybeSingle();
        let invoiceId = existing?.id;
        if (!invoiceId) {
          const stamp = periodStart.slice(0, 7).replace("-", "");
          const short = officeId.replace(/-/g, "").slice(0, 6).toUpperCase();
          const { data: created, error: createError } = await admin.from("billing_invoices").insert({ office_id: officeId, period_start: periodStart, period_end: periodEnd, status: "draft", invoice_number: `DS-${stamp}-${short}` }).select("id").single();
          if (createError) throw createError;
          invoiceId = created.id;
        }
        if (existing?.status === "paid") continue;
        const { error: attachError } = await admin.from("billing_line_items").update({ invoice_id: invoiceId, status: "invoiced", updated_at: new Date().toISOString() }).eq("office_id", officeId).eq("status", "unbilled").gte("service_date", periodStart).lte("service_date", periodEnd);
        if (attachError) throw attachError;
        await recalcInvoice(admin, invoiceId);
        await admin.from("billing_invoices").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", invoiceId);
        generated += 1;
      }
      return NextResponse.json({ generated, invoices: await loadInvoices(admin) });
    }

    if (action === "credit") {
      const invoiceId = String(body.invoiceId || "");
      const amountCents = Math.round(Number(body.amountCents || 0));
      const reason = String(body.reason || "").trim();
      if (!invoiceId || amountCents <= 0 || reason.length < 3) return NextResponse.json({ error: "Enter a valid credit amount and reason." }, { status: 400 });
      const { data: invoice } = await admin.from("billing_invoices").select("office_id,status").eq("id", invoiceId).maybeSingle();
      if (!invoice || invoice.status === "paid" || invoice.status === "void") return NextResponse.json({ error: "This invoice can no longer be adjusted." }, { status: 400 });
      const { error } = await admin.from("billing_adjustments").insert({ invoice_id: invoiceId, office_id: invoice.office_id, amount_cents: amountCents, reason, created_by: ctx.userId });
      if (error) throw error;
      await recalcInvoice(admin, invoiceId);
      return NextResponse.json({ invoices: await loadInvoices(admin) });
    }

    if (action === "charge") {
      if (!stripeSecretKey) return NextResponse.json({ error: "Stripe has not been configured." }, { status: 503 });
      const invoiceId = String(body.invoiceId || "");
      const { data: invoice } = await admin.from("billing_invoices").select("id,office_id,status,period_start,period_end,invoice_number,total_cents,offices(name,communication_email)").eq("id", invoiceId).maybeSingle();
      if (!invoice || invoice.status === "paid" || invoice.status === "void") return NextResponse.json({ error: "Invoice is not chargeable." }, { status: 400 });
      const totals = await recalcInvoice(admin, invoiceId);
      const { data: billing } = await admin.from("office_billing_profiles").select("provider_customer_id,provider_payment_method_id,payment_method_on_file,billing_status,autopay_enabled").eq("office_id", invoice.office_id).maybeSingle();
      if (!billing?.payment_method_on_file || !billing.provider_customer_id || !billing.provider_payment_method_id || billing.billing_status !== "active") return NextResponse.json({ error: "This office does not have an active card on file." }, { status: 402 });
      const now = new Date().toISOString();
      if (totals.total > 0) {
        const params = new URLSearchParams();
        params.set("amount", String(totals.total));
        params.set("currency", "cad");
        params.set("customer", billing.provider_customer_id);
        params.set("payment_method", billing.provider_payment_method_id);
        params.set("confirm", "true");
        params.set("off_session", "true");
        params.set("description", `DentalShift ${invoice.invoice_number || "monthly invoice"}`);
        params.set("metadata[invoice_id]", invoiceId);
        params.set("metadata[office_id]", invoice.office_id);
        const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", { method: "POST", headers: { Authorization: `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `dentalshift-invoice-${invoiceId}` }, body: params.toString() });
        const payment = await stripeResponse.json() as any;
        if (!stripeResponse.ok || payment.status !== "succeeded") {
          await admin.from("billing_invoices").update({ status: "failed", failed_at: now, provider_invoice_id: payment?.id ?? null, updated_at: now }).eq("id", invoiceId);
          return NextResponse.json({ error: payment?.error?.message || "The saved card charge failed." }, { status: 402 });
        }
        await admin.from("billing_invoices").update({ status: "paid", charged_at: now, paid_at: now, provider_invoice_id: payment.id, updated_at: now }).eq("id", invoiceId);
      } else {
        await admin.from("billing_invoices").update({ status: "paid", charged_at: now, paid_at: now, updated_at: now }).eq("id", invoiceId);
      }
      await admin.from("billing_line_items").update({ status: "paid", updated_at: now }).eq("invoice_id", invoiceId).eq("status", "invoiced");
      const { data: unlockItems } = await admin.from("billing_line_items").select("source_id").eq("invoice_id", invoiceId).eq("source_type", "dentaljobs_unlock");
      const unlockIds = (unlockItems ?? []).map((row: any) => row.source_id).filter(Boolean);
      if (unlockIds.length) await admin.from("candidate_unlocks").update({ status: "paid", paid_at: now, updated_at: now }).in("id", unlockIds);

      const office = Array.isArray(invoice.offices) ? invoice.offices[0] : invoice.offices;
      const email = office?.communication_email;
      const resendApiKey = process.env.RESEND_API_KEY;
      if (email && resendApiKey) {
        const { data: lineItems } = await admin.from("billing_line_items").select("service_date,description,amount_cents,source_type").eq("invoice_id", invoiceId).order("service_date");
        const { data: credits } = await admin.from("billing_adjustments").select("reason,amount_cents").eq("invoice_id", invoiceId);
        const rows = (lineItems ?? []).map((row: any) => `<tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;">${escapeEmailHtml(row.service_date)}</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;">${escapeEmailHtml(row.description)}</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;text-align:right;">$${(row.amount_cents/100).toFixed(2)}</td></tr>`).join("");
        const creditRows = (credits ?? []).map((row: any) => `<tr><td></td><td style="padding:8px;color:#017f27;">Credit: ${escapeEmailHtml(row.reason)}</td><td style="padding:8px;text-align:right;color:#017f27;">-$${(row.amount_cents/100).toFixed(2)}</td></tr>`).join("");
        const html = renderDentalShiftEmail({ siteUrl, preheader: "Your monthly DentalShift invoice has been paid.", title: "DentalShift monthly invoice", greeting: `Hello ${office?.name || "Dental Office"},`, intro: `Your combined DentalShift invoice for ${invoice.period_start} through ${invoice.period_end} has been processed.`, bodyHtml: `<div style="margin:18px 0;padding:18px;border:1px solid #E2E8F0;border-radius:12px;"><strong style="color:#002757;">${escapeEmailHtml(invoice.invoice_number || "Invoice")}</strong><table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:14px;">${rows}${creditRows}</table><p style="margin:16px 0 0;text-align:right;font-size:18px;font-weight:800;color:#002757;">Total: $${(totals.total/100).toFixed(2)} CAD</p></div>`, actionLabel: "Open DentalShift", actionUrl: siteUrl });
        const emailResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "DentalShift <support@dentalshift.ca>", to: [email], subject: `DentalShift invoice ${invoice.invoice_number || ""}`.trim(), html, text: `DentalShift invoice ${invoice.invoice_number || ""}\nTotal paid: $${(totals.total/100).toFixed(2)} CAD` }) });
        if (emailResponse.ok) await admin.from("billing_invoices").update({ emailed_at: new Date().toISOString() }).eq("id", invoiceId);
      }
      return NextResponse.json({ invoices: await loadInvoices(admin) });
    }

    return NextResponse.json({ error: "Unknown billing action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Billing action failed." }, { status: 500 });
  }
}
