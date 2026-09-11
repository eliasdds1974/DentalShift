"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type ContactSettings = {
  company_name: string;
  support_email: string;
  phone: string;
  website: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

const EMPTY: ContactSettings = {
  company_name: "DentalShift",
  support_email: "",
  phone: "",
  website: "https://www.dentalshift.ca",
  address_line1: "",
  address_line2: "",
  city: "",
  province: "",
  postal_code: "",
  country: "Canada",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setChecking(false);
        return;
      }

      try {
        const details = await loadAccountDetails(user.id);
        if (!active || details.profile.role !== "admin") {
          setChecking(false);
          return;
        }

        setAuthorized(true);
        const { data, error: loadError } = await supabase
          .from("dentalshift_contact_settings")
          .select("company_name,support_email,phone,website,address_line1,address_line2,city,province,postal_code,country")
          .eq("id", true)
          .single();
        if (loadError) throw loadError;

        if (active && data) {
          setSettings({
            company_name: data.company_name || "DentalShift",
            support_email: data.support_email || "",
            phone: data.phone || "",
            website: data.website || "",
            address_line1: data.address_line1 || "",
            address_line2: data.address_line2 || "",
            city: data.city || "",
            province: data.province || "",
            postal_code: data.postal_code || "",
            country: data.country || "Canada",
          });
        }
      } catch {
        if (active) setError("DentalShift contact settings could not be loaded.");
      } finally {
        if (active) setChecking(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const update = (key: keyof ContactSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Admin session not found.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("dentalshift_contact_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", true);

    if (saveError) setError("Contact information could not be saved.");
    else setSaved(true);
    setSaving(false);
  };

  if (checking) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f8fb]"><p className="font-black text-[#002757]">Opening DentalShift settings…</p></main>;
  }

  if (!authorized) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f8fb] p-6"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-[#002757]">Admin access required</h1><button onClick={() => router.push("/admin/overview")} className="mt-5 rounded-xl bg-[#002757] px-4 py-2.5 font-black text-white">Return to Admin</button></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f8fb] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-12 w-auto" priority />
            <div className="mt-5 flex items-center gap-2 text-sm font-black uppercase tracking-[.12em] text-[#01A32E]"><Settings size={17} /> Admin settings</div>
            <h1 className="mt-2 text-3xl font-black text-[#002757]">DentalShift Contact Information</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">This is the central source for DentalShift contact information used in branded PDFs, reports, notices and other platform documents.</p>
          </div>
          <button onClick={() => router.push("/admin/overview")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm"><ArrowLeft size={17} /> Back to Admin</button>
        </div>

        <form onSubmit={save} className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Company name</span><input value={settings.company_name} onChange={(e) => update("company_name", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Support email</span><input type="email" value={settings.support_email} onChange={(e) => update("support_email", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Phone</span><input value={settings.phone} onChange={(e) => update("phone", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Website</span><input value={settings.website} onChange={(e) => update("website", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-black text-slate-700">Address line 1</span><input value={settings.address_line1} onChange={(e) => update("address_line1", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-black text-slate-700">Address line 2</span><input value={settings.address_line2} onChange={(e) => update("address_line2", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">City</span><input value={settings.city} onChange={(e) => update("city", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Province</span><input value={settings.province} onChange={(e) => update("province", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Postal code</span><input value={settings.postal_code} onChange={(e) => update("postal_code", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-black text-slate-700">Country</span><input value={settings.country} onChange={(e) => update("country", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
          </div>

          {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
          {saved && <p className="mt-5 rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27]">DentalShift contact information saved.</p>}

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E] disabled:opacity-60"><Save size={17} /> {saving ? "Saving…" : "Save Contact Information"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
