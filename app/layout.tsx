import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChargeSessionProvider } from "@/lib/polling/ChargeSessionContext";
import { NavBar } from "@/components/layout/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charge Monitor",
  description: "Tesla Fleet APIを利用した充電セッション記録・分析アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-void text-ink">
        <ChargeSessionProvider>
          <NavBar />
          <main className="w-full flex-1 px-4 pt-6 pb-24 sm:px-6">{children}</main>
        </ChargeSessionProvider>
      </body>
    </html>
  );
}
