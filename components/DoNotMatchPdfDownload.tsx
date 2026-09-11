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

type ReportRow = {
  primary: string;
  secondary: string;
  tertiary?: string;
};

type LogoImage = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

const DEFAULT_CONTACT: ContactSettings = {
  company_name: "DentalShift",
  support_email: "",
  phone: "",
  website: "www.dentalshift.ca",
  address_line1: "",
  address_line2: "",
  city: "",
  province: "",
  postal_code: "",
  country: "Canada",
};

const NAVY = "0 0.153 0.341";
const GREEN = "0.004 0.639 0.180";
const WHITE = "1 1 1";
const SLATE = "0.392 0.455 0.545";
const LIGHT = "0.965 0.976 0.988";
const LIGHT_GREEN = "0.918 0.976 0.929";
const BORDER = "0.855 0.882 0.918";

function pdfEscape(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function clean(value?: string | null) {
  return String(value || "").trim();
}

function formatPhone(value?: string | null) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function fit(value: string, max: number) {
  const normalized = pdfEscape(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function text(x: number, y: number, size: number, value: string, bold = false, color = NAVY) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`;
}

function rect(x: number, y: number, w: number, h: number, fill: string, stroke?: string, lineWidth = 1) {
  const parts = ["q", `${fill} rg`];
  if (stroke) parts.push(`${stroke} RG`, `${lineWidth} w`);
  parts.push(`${x} ${y} ${w} ${h} re`, stroke ? "B" : "f", "Q");
  return parts.join("\n");
}

function line(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1) {
  return `q ${color} RG ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

function bytesFromText(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function base64Bytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function loadLogo(): Promise<LogoImage | null> {
  try {
    const image = new Image();
    image.src = "/dentalshift-logo.svg";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Logo could not be loaded"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 300;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    return {
      bytes: base64Bytes(dataUrl.split(",")[1] || ""),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

function contactLines(contact: ContactSettings) {
  const locality = [contact.city, contact.province, contact.postal_code].filter(Boolean).join(" ");
  const address = [contact.address_line1, contact.address_line2].filter(Boolean).join(", ");
  return [
    contact.company_name || "DentalShift",
    [contact.support_email, formatPhone(contact.phone)].filter(Boolean).join("  |  "),
    contact.website,
    [address, locality, contact.country].filter(Boolean).join(", "),
  ].filter(Boolean).slice(0, 4);
}

function footerContact(contact: ContactSettings) {
  return [
    contact.support_email,
    formatPhone(contact.phone),
    contact.website,
  ].filter(Boolean).join("  |  ") || "www.dentalshift.ca";
}

function makePageContent(options: {
  role: Exclude<PortalRole, null>;
  subjectName: string;
  subjectLocation: string;
  generated: string;
  contact: ContactSettings;
  rows: ReportRow[];
  pageIndex: number;
  pageCount: number;
  hasLogo: boolean;
}) {
  const { role, subjectName, subjectLocation, generated, contact, rows, pageIndex, pageCount, hasLogo } = options;
  const commands: string[] = [];

  commands.push(rect(0, 0, 612, 792, WHITE));

  if (hasLogo) commands.push("q 150 0 0 50 42 716 cm /Logo Do Q");
  else {
    commands.push(text(42, 744, 24, "DentalShift", true, NAVY));
    commands.push(rect(42, 732, 92, 4, GREEN));
  }

  const cLines = contactLines(contact);
  cLines.forEach((value, index) => {
    commands.push(text(380, 754 - index * 12, index === 0 ? 9.5 : 8, fit(value, 43), index === 0, index === 0 ? NAVY : SLATE));
  });

  commands.push(rect(40, 626, 532, 76, NAVY));
  commands.push(text(56, 669, 23, "Do Not Match List", true, WHITE));
  commands.push(text(56, 646, 10, role === "office" ? "OFFICE RECORD" : "PROFESSIONAL RECORD", true, "0.608 0.890 0.678"));
  commands.push(rect(455, 661, 96, 23, GREEN));
  commands.push(text(467, 669, 9, "CONFIDENTIAL", true, WHITE));

  commands.push(rect(40, 566, 532, 44, LIGHT, BORDER));
  commands.push(text(54, 592, 8, "PREPARED FOR", true, SLATE));
  commands.push(text(54, 575, 11, fit(subjectName, 38), true, NAVY));
  if (subjectLocation) commands.push(text(226, 575, 9, fit(subjectLocation, 30), false, SLATE));
  commands.push(text(400, 592, 8, "GENERATED", true, SLATE));
  commands.push(text(400, 575, 9.5, fit(generated, 25), true, NAVY));
  commands.push(text(510, 592, 8, "TOTAL", true, SLATE));
  commands.push(text(520, 575, 11, String(options.pageCount === 0 ? 0 : ""), true, NAVY));

  const tableY = 536;
  commands.push(rect(40, tableY, 532, 24, GREEN));

  if (role === "office") {
    commands.push(text(50, tableY + 8, 8.5, "#", true, WHITE));
    commands.push(text(78, tableY + 8, 8.5, "PROFESSIONAL", true, WHITE));
    commands.push(text(280, tableY + 8, 8.5, "CITY / PROVINCE", true, WHITE));
    commands.push(text(454, tableY + 8, 8.5, "PHONE", true, WHITE));
  } else {
    commands.push(text(50, tableY + 8, 8.5, "#", true, WHITE));
    commands.push(text(78, tableY + 8, 8.5, "DENTAL OFFICE", true, WHITE));
    commands.push(text(286, tableY + 8, 8.5, "ADDRESS / LOCATION", true, WHITE));
  }

  const rowHeight = role === "office" ? 24 : 30;
  let y = tableY - rowHeight;

  if (rows.length === 0) {
    commands.push(rect(40, y, 532, 42, LIGHT_GREEN, BORDER));
    commands.push(text(58, y + 16, 10, role === "office" ? "No professionals are currently on this Do Not Match list." : "No dental offices are currently on this Do Not Match list.", true, NAVY));
  } else {
    rows.forEach((row, index) => {
      const bg = index % 2 === 0 ? WHITE : LIGHT;
      commands.push(rect(40, y, 532, rowHeight, bg, BORDER, 0.45));
      commands.push(text(50, y + (role === "office" ? 8 : 12), 8.5, String((pageIndex * (role === "office" ? 18 : 14)) + index + 1), true, SLATE));
      if (role === "office") {
        commands.push(text(78, y + 8, 9.5, fit(row.primary, 32), true, NAVY));
        commands.push(text(280, y + 8, 9, fit(row.secondary, 25), false, SLATE));
        commands.push(text(454, y + 8, 9, fit(row.tertiary || "", 18), false, NAVY));
      } else {
        commands.push(text(78, y + 12, 9.5, fit(row.primary, 30), true, NAVY));
        commands.push(text(286, y + 16, 8.5, fit(row.secondary, 44), false, SLATE));
        if (row.tertiary) commands.push(text(286, y + 6, 8, fit(row.tertiary, 44), false, SLATE));
      }
      y -= rowHeight;
    });
  }

  commands.push(line(40, 48, 572, 48, GREEN, 1.4));
  commands.push(text(40, 31, 7.7, `DentalShift  |  ${fit(footerContact(contact), 70)}`, false, SLATE));
  commands.push(text(430, 31, 7.7, `Confidential  |  Page ${pageIndex + 1} of ${pageCount}`, true, NAVY));
  commands.push(text(40, 17, 6.8, "This document is intended for the account holder's private internal records.", false, "0.58 0.62 0.68"));

  return commands.join("\n");
}

function buildBrandedPdf(options: {
  role: Exclude<PortalRole, null>;
  subjectName: string;
  subjectLocation: string;
  generated: string;
  contact: ContactSettings;
  rows: ReportRow[];
  logo: LogoImage | null;
}) {
  const perPage = options.role === "office" ? 18 : 14;
  const pageRows: ReportRow[][] = [];
  for (let i = 0; i < options.rows.length; i += perPage) pageRows.push(options.rows.slice(i, i + perPage));
  if (pageRows.length === 0) pageRows.push([]);

  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  const logoId = options.logo ? 5 : null;
  let nextId = options.logo ? 6 : 5;
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  for (let i = 0; i < pageRows.length; i += 1) {
    pageIds.push(nextId++);
    contentIds.push(nextId++);
  }

  const objectCount = nextId - 1;
  const objects: Array<Uint8Array | undefined> = new Array(objectCount + 1);
  objects[catalogId] = bytesFromText(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  objects[fontRegularId] = bytesFromText("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects[fontBoldId] = bytesFromText("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  if (options.logo && logoId) {
    const prefix = bytesFromText(`<< /Type /XObject /Subtype /Image /Width ${options.logo.width} /Height ${options.logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${options.logo.bytes.length} >>\nstream\n`);
    const suffix = bytesFromText("\nendstream");
    objects[logoId] = concatBytes([prefix, options.logo.bytes, suffix]);
  }

  pageRows.forEach((rows, index) => {
    const content = makePageContent({
      ...options,
      rows,
      pageIndex: index,
      pageCount: pageRows.length,
      hasLogo: Boolean(options.logo && logoId),
    });
    const contentBytes = bytesFromText(content);
    objects[contentIds[index]] = bytesFromText(`<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`);

    const xObject = logoId ? ` /XObject << /Logo ${logoId} 0 R >>` : "";
    objects[pageIds[index]] = bytesFromText(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >>${xObject} >> /Contents ${contentIds[index]} 0 R >>`);
  });

  objects[pagesId] = bytesFromText(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);

  const chunks: Uint8Array[] = [bytesFromText("%PDF-1.4\n%DentalShift\n")];
  const offsets = new Array(objectCount + 1).fill(0);
  let byteOffset = chunks[0].length;

  for (let id = 1; id <= objectCount; id += 1) {
    const object = objects[id] || bytesFromText("<< >>");
    const wrapped = concatBytes([
      bytesFromText(`${id} 0 obj\n`),
      object,
      bytesFromText("\nendobj\n"),
    ]);
    offsets[id] = byteOffset;
    chunks.push(wrapped);
    byteOffset += wrapped.length;
  }

  const xrefOffset = byteOffset;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objectCount + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(bytesFromText(xref));

  return new Blob([concatBytes(chunks)], { type: "application/pdf" });
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

      const details = await loadAccountDetails(user.id);
      const generated = new Date().toLocaleString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const { data: contactData } = await supabase
        .from("dentalshift_contact_settings")
        .select("company_name,support_email,phone,website,address_line1,address_line2,city,province,postal_code,country")
        .eq("id", true)
        .maybeSingle();

      const contact: ContactSettings = {
        ...DEFAULT_CONTACT,
        ...(contactData || {}),
      };

      let subjectName = "DentalShift Member";
      let subjectLocation = "";
      let rows: ReportRow[] = [];

      if (role === "office") {
        const officeId = details.office?.id;
        if (!officeId) throw new Error("Office not found");
        subjectName = details.office?.name || "Dental Office";
        subjectLocation = [details.office?.city, details.office?.province].filter(Boolean).join(", ");

        const { data, error } = await supabase
          .from("office_do_not_match")
          .select("first_name,last_name,city,province,phone")
          .eq("office_id", officeId)
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true });
        if (error) throw error;

        rows = ((data || []) as OfficeRow[]).map((row) => ({
          primary: [row.last_name, row.first_name].filter(Boolean).join(", "),
          secondary: [row.city, row.province].filter(Boolean).join(", "),
          tertiary: formatPhone(row.phone),
        }));
      } else {
        subjectName = [details.profile.first_name, details.profile.last_name].filter(Boolean).join(" ") || "Dental Professional";
        subjectLocation = [details.profile.city, details.profile.province].filter(Boolean).join(", ");

        const { data, error } = await supabase
          .from("professional_do_not_match_offices")
          .select("office_name,formatted_address,city,province")
          .eq("professional_id", user.id)
          .order("office_name", { ascending: true });
        if (error) throw error;

        rows = ((data || []) as ProfessionalRow[]).map((row) => {
          const fallbackLocation = [row.city, row.province].filter(Boolean).join(", ");
          const address = clean(row.formatted_address);
          return {
            primary: row.office_name,
            secondary: address || fallbackLocation,
            tertiary: address && fallbackLocation && !address.toLowerCase().includes(fallbackLocation.toLowerCase()) ? fallbackLocation : "",
          };
        });
      }

      const logo = await loadLogo();
      const blob = buildBrandedPdf({
        role,
        subjectName,
        subjectLocation,
        generated,
        contact,
        rows,
        logo,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeSubject = subjectName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "Account";
      link.href = url;
      link.download = `DentalShift-Do-Not-Match-${safeSubject}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
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
        title="Download branded Do Not Match PDF"
        aria-label="Download branded Do Not Match PDF"
      >
        <FileDown size={17} />
        <span>{busy ? "Building…" : "PDF"}</span>
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
          border-color: #01A32E;
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
