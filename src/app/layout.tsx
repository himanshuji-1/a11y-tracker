import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "a11y-tracker — Real WCAG Accessibility Fixes, Not Another Overlay Widget",
  description:
    "Scan any website for WCAG 2.1/2.2 AA violations, get AI-powered code fixes, track genuine remediation, and generate legal compliance reports. Real accessibility fixes, not another overlay widget.",
  openGraph: {
    title: "a11y-tracker — Real Accessibility Fixes",
    description: "Scan any site for WCAG violations, get AI code fixes, and generate compliance reports.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
