import type { Metadata } from "next";
import "./globals.css";
import { ProfessionalMarketplaceCleanup } from "@/components/ProfessionalMarketplaceCleanup";
import { ProfessionalAvailabilityCalendar } from "@/components/ProfessionalAvailabilityCalendar";
import { ProfessionalInvitationCalendar } from "@/components/ProfessionalInvitationCalendar";
import { ProfessionalWorkspacePolish } from "@/components/ProfessionalWorkspacePolish";
import { OfficeWorkspacePolish } from "@/components/OfficeWorkspacePolish";

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
      <body className="antialiased">{children}<ProfessionalMarketplaceCleanup /><ProfessionalAvailabilityCalendar /><ProfessionalInvitationCalendar /><ProfessionalWorkspacePolish /><OfficeWorkspacePolish /></body>
    </html>
  );
}
