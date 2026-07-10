import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Atelier",
  description:
    "A community-first platform for creators — art, handmade, photography, music. No ads, no pay-to-be-seen. Funded by donations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${grotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:border-2 focus:border-ink focus:bg-yellow focus:px-4 focus:py-2 focus:text-caption focus:font-bold focus:uppercase"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
