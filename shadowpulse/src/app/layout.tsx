import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ShadowPulse — Shadowban & reach suppression scanner",
  description:
    "Quét tín hiệu hạn chế hiển thị công khai trên X, Instagram, TikTok, Facebook và Threads. Trung thực, có confidence, không verdict bịa.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div className="shell min-h-screen">{children}</div>
      </body>
    </html>
  );
}
