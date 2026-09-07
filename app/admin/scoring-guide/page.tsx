"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";
import { LATE_CANCELLATION_HOURS, calculateReliability, classifyCancellation } from "@/lib/booking-reliability";

export default function ScoringGuidePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/admin/overview"); return; }
      try {
        const account = await loadAccountDetails(data.user.id);
        if (!active) return;
        if (account.profile.role !== "admin") { router.replace("/admin/overview"); return; }
        setAuthorized(true);
      } catch { if (active) router.replace("/admin/overview"); }
      finally { if (active) setChecking(false); }
    })();
    return () => { active = false; };
  }, [router]);
  if (checking || !authorized) return <main className="p-8 text-sm text-slate-600">Checking administrator access…</main>;
  const example = calculateReliability([{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"completed"},{kind:"late"}]);
  return <main className="min-h-screen bg-[#f5f8fb] p-4 text-slate-900 sm:p-8"><div className="mx-auto max-w-4xl space-y-6"><Link href="/admin/overview" className="text-sm font-bold text-[#017f27]">← Admin overview</Link><header><h1 className="text-3xl font-black text-[#032757]">Scoring & cancellation guide</h1><p className="mt-2 text-sm text-slate-600">Internal reference for explaining DentalShift scores and cancellation decisions.</p></header>
  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><h2 className="font-black">Implementation status</h2><p className="mt-2">The cancellation classification and reliability formula below are implemented in the shared calculation module. The database cancellation workflow, automatic score updates, and admin excusal controls are not yet verified as connected. Rating details below are the proposed policy, not a verified live calculation. Do not describe these features as fully operational until integration is complete.</p></section>
  <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#032757]">Rating — quality of work</h2><p className="mt-2 text-sm">Proposed: after a completed shift, the office rates work quality, professionalism, communication, and teamwork from 1–5. The shift rating is the average of those four categories. The overall rating is the average of eligible shift ratings. Display the review count beside the score.</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">Example: 5, 4, 5, 4 → (5 + 4 + 5 + 4) ÷ 4 = 4.5 / 5.</p><p className="mt-2 text-xs text-slate-500">No reviews: display “New — no reviews yet.” The four-category collection and aggregation are not yet verified in the live review system.</p></section>
  <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#032757]">Reliability — commitment fulfillment</h2><p className="mt-2 text-sm">Implemented calculation: completed ÷ (completed + unexcused late cancellations + unexcused no-shows) × 100, rounded to the nearest whole percent. Early, office, and excused cancellations are excluded. No eligible history returns no score.</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">Example: {example.completed} completed + {example.late} late cancellation = {example.score}% reliability.</p><p className="mt-2 text-xs text-slate-500">A no-show currently counts as one failure, not a heavier weighted penalty. A separate no-show count can still be displayed. Automatic persistence and score recalculation are not yet verified.</p></section>
  <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#032757]">Cancellation classification</h2><p className="mt-2 text-sm">The proposed threshold is {LATE_CANCELLATION_HOURS} hours. The calculation compares the scheduled start timestamp with the cancellation timestamp. Exactly 24 hours before start is early; less than 24 hours is late. Office cancellations are classified separately. A no-show must be explicitly identified; the current helper does not automatically detect attendance failures.</p><div className="mt-4 space-y-2 text-sm"><p><strong>Early:</strong> professional cancels at least 24 hours before start; excluded from reliability.</p><p><strong>Late:</strong> professional cancels less than 24 hours before start; counts unless excused.</p><p><strong>No-show:</strong> confirmed attendance failure; counts unless excused.</p><p><strong>Office cancellation:</strong> excluded from professional reliability.</p><p><strong>Excused:</strong> reviewed exception; excluded from the score.</p></div><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">Example: Monday 8:00 AM shift, cancelled Sunday 6:00 PM → 14 hours before start → late cancellation.</p></section>
  <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#032757]">Evidence & dispute handling</h2><p className="mt-2 text-sm">Planned workflow: record the booking ID, original start time, server cancellation time, cancelling party, reason, classification, and any admin excusal decision. Preserve the original event and an audit trail when a decision is changed. An office cancellation or declined invitation must not become a professional failure. Admins should review disputed no-shows and emergencies before applying an excusal.</p><p className="mt-3 text-xs text-slate-500">Reference: lib/booking-reliability.ts. This page is explanatory and does not itself modify scores, bookings, or cancellation records.</p></section>
  </div></main>;
}
