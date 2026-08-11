import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareLink — NEMT Platform",
  description:
    "On-demand Non-Emergency Medical Transportation connecting healthcare facilities with ambulance providers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
