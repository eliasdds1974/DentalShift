"use client";

import { Copy, Download, Facebook, Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  listingId: string;
  compact?: boolean;
};

export function ShareListingButton({ listingId, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/jobs/${listingId}`
    : `https://www.dentalshift.ca/jobs/${listingId}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=760,height=680");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "DentalJobs on DentalShift", url: shareUrl });
        return;
      } catch {
        return;
      }
    }
    setOpen((value) => !value);
  };

  return <div className="relative">
    <button
      type="button"
      onClick={() => { if (compact && navigator.share) void nativeShare(); else setOpen((value) => !value); }}
      className={compact
        ? "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#002757] shadow-sm hover:border-[#4285F4] hover:bg-[#f7faff]"
        : "inline-flex items-center gap-2 rounded-xl border-2 border-[#4285F4] bg-white px-4 py-2.5 text-sm font-black text-[#245FB8] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eef4ff]"}
      aria-expanded={open}
    >
      <Share2 size={compact ? 14 : 16} /> Share Listing
    </button>

    {open && <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
      <p className="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Share to your dental groups</p>
      <button type="button" onClick={shareFacebook} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black text-[#1877F2] hover:bg-[#eef4ff]"><Facebook size={17}/> Share to Facebook</button>
      <button type="button" onClick={() => void copyLink()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"><Copy size={17}/>{copied ? "Link copied" : "Copy listing link"}</button>
      <a href={`/api/dentaljobs/share-card?id=${encodeURIComponent(listingId)}&download=1`} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"><Download size={17}/> Download share card</a>
      <div className="mt-2 rounded-xl bg-[#f7faff] px-3 py-2 text-[11px] font-semibold leading-5 text-slate-500">The shared page keeps private identity details hidden and sends visitors back to DentalShift.</div>
    </div>}
  </div>;
}
