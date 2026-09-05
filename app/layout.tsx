import type { Metadata } from "next";
import "./globals.css";
import { ProfessionalLocationField } from "@/components/ProfessionalLocationField";
import { ProfessionalMarketplaceCleanup } from "@/components/ProfessionalMarketplaceCleanup";
import { ProfessionalAvailabilityCalendar } from "@/components/ProfessionalAvailabilityCalendar";
import { ProfessionalInvitationCalendar } from "@/components/ProfessionalInvitationCalendar";

export const metadata: Metadata = {
  title: "DentalShift | Dental staffing made simple",
  description: "Book verified Canadian dental professionals or find flexible dental shifts near you.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<ProfessionalLocationField /><ProfessionalMarketplaceCleanup /><ProfessionalAvailabilityCalendar /><ProfessionalInvitationCalendar /></body>
    </html>
  );
}
