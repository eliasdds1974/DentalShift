"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown } from "lucide-react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type PortalRole = "office" | "professional" | null;

type OfficeRow = {
  first_name: string;
  last_name: string;
  city: string;
  province: string | null;
  phone: string | null;
};

type ProfessionalRow = {
  office_name: string;
  formatted_address: string | null;
  city: string | null;
  province: string | null;
};

function pdfEscape(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatPhone(value?: string | null) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function buildPdf(lines: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 54;
  const startY = 738;
  const lineHeight = 18;
  const maxLinesPerPage = 36;
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }
  if (pages.length === 0) pages.push(["No entries."]);

  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  let nextId = 4;
  const pageIds: number[] = [];

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[fontId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  for (const pageLines of pages) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);

    const contentParts = ["BT", "/F1 11 Tf", `${marginX} ${startY} Td`];
    pageLines.forEach((line, index) => {
      if (index > 0) contentParts.push(`0 -${lineHeight} Td`);
      contentParts.push(`(${pdfEscape(line)}) Tj`);
    });
    contentParts.push("ET");
    const stream = contentParts.join("\n");

    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
  }

  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function DoNotMatchPdfDownload() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [role, setRole] = useState<PortalRole>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let disposed = false;
    let attempts = 0;
    let timer: number | undefined;

    const locate = () => {
      if (disposed) return;
      attempts += 1;
      const card = document.querySelector<HTMLElement>("#dentaljobs-do-not-match-slot .do-not-match-native");
      if (card) {
        card.classList.add("has-pdf-download");
        setTarget(card);
        return;
      }
      if (attempts < 30) timer = window.setTimeout(locate, 100);
    };

    const storedRole = window.localStorage.getItem("dentalshift_portal_role");
    setRole(storedRole === "office" ? "office" : storedRole === "professional" ? "professional" : null);
    locate();

    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const download = async () => {
    if (!role || busy) return;
    setBusy(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const generated = new Date().toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let lines: string[] = [
        "DentalShift - Do Not Match List",
        `Generated: ${generated}`,
        "",
      ];

      if (role === "office") {
        const details = await loadAccountDetails(user.id);
        const officeId = details.office?.id;
        if (!officeId) throw new Error("Office not found");

        lines.push(`Office: ${details.office?.name || "Dental Office"}`);
        lines.push("");

        const { data, error } = await supabase
          .from("office_do_not_match")
          .select("first_name,last_name,city,province,phone")
          .eq("office_id", officeId)
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true });
        if (error) throw error;

        const rows = (data || []) as OfficeRow[];
        if (rows.length === 0) {
          lines.push("No professionals are currently on this Do Not Match list.");
        } else {
          rows.forEach((row, index) => {
            const location = [row.city, row.province].filter(Boolean).join(", ");
            const phone = formatPhone(row.phone);
            lines.push(`${index + 1}. ${row.last_name}, ${row.first_name}`);
            lines.push(`   ${[location, phone].filter(Boolean).join(" | ")}`);
          });
        }
      } else {
        const details = await loadAccountDetails(user.id);
        const displayName = [details.profile.first_name, details.profile.last_name].filter(Boolean).join(" ") || "Dental Professional";
        lines.push(`Professional: ${displayName}`);
        lines.push("");

        const { data, error } = await supabase
          .from("professional_do_not_match_offices")
          .select("office_name,formatted_address,city,province")
          .eq("professional_id", user.id)
          .order("office_name", { ascending: true });
        if (error) throw error;

        const rows = (data || []) as ProfessionalRow[];
        if (rows.length === 0) {
          lines.push("No dental offices are currently on this Do Not Match list.");
        } else {
          rows.forEach((row, index) => {
            const location = row.formatted_address || [row.city, row.province].filter(Boolean).join(", ");
            lines.push(`${index + 1}. ${row.office_name}`);
            if (location) lines.push(`   ${location}`);
          });
        }
      }

      const blob = buildPdf(lines);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DentalShift-Do-Not-Match-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert("The Do Not Match PDF could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!target || !role) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="do-not-match-pdf-download"
        onClick={() => void download()}
        disabled={busy}
        title="Download Do Not Match list as PDF"
        aria-label="Download Do Not Match list as PDF"
      >
        <FileDown size={17} />
        <span>PDF</span>
      </button>
      <style jsx global>{`
        #dentaljobs-do-not-match-slot .do-not-match-native.has-pdf-download {
          padding-bottom: 48px !important;
        }
        #dentaljobs-do-not-match-slot .do-not-match-pdf-download {
          position: absolute;
          right: 12px;
          bottom: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          border: 1px solid #002757;
          border-radius: 8px;
          background: #ffffff;
          padding: 0 8px;
          color: #002757;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 39, 87, .10);
        }
        #dentaljobs-do-not-match-slot .do-not-match-pdf-download:hover {
          background: #002757;
          color: #ffffff;
        }
        #dentaljobs-do-not-match-slot .do-not-match-pdf-download:disabled {
          opacity: .55;
          cursor: default;
        }
      `}</style>
    </>,
    target
  );
}
