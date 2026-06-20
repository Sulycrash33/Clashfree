import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('clashfree-theme');var r=t==='dark'?'dark':(t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):'light');document.documentElement.classList.add(r);}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />
      </head>
      <body
        className={`${jakarta.variable} ${fraunces.variable} ${plexMono.variable} font-sans antialiased`}
      >
        <ThemeProvider defaultTheme="light" storageKey="clashfree-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
