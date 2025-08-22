import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "./custom.css";
import AccessGate from "@/components/AccessGate";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Helper Monitoreos",
  description: "Herramienta de uso exclusivo para Valeria Bustamante",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <Analytics/>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 dark:bg-gray-900`}>
        <AccessGate>
          {children}
        </AccessGate>
      </body>
    </html>
  );
}
