"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { usePathname } from "next/navigation";

export function ProfessionalDigitalResumeLink() {
  const pathname = usePathname();
  if (pathname !== "/professionals/profile") return null;

  return (
    <Link
      href="/professionals/resume"
      className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-2xl bg-[#002757] px-5 py-3 text-sm font-black text-white shadow-xl ring-2 ring-white transition hover:-translate-y-0.5 hover:bg-[#01A32E]"
    >
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/12"><FileText size={17} /></span>
      Digital Resume
    </Link>
  );
}
