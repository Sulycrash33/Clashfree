import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClashFree - Automatic Timetable Generator",
  description: "Revolutionary academic scheduling system for Nigerian universities. Smart engine detects conflicts before they happen. Zero clashes guaranteed.",
  keywords: ["Timetable", "University", "Nigeria", "Exam scheduling", "Lecture scheduling", "Conflict detection", "NSUK", "ABU", "UNILAG"],
  authors: [{ name: "ClashFree Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ClashFree - Automatic Timetable Generator",
    description: "End timetable clashes permanently. Smart engine detects conflicts before they happen.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClashFree - Automatic Timetable Generator",
    description: "End timetable clashes permanently. Smart engine detects conflicts before they happen.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
