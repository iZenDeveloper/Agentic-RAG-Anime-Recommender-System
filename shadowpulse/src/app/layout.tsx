import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["600", "700"],
  style: ["normal"],
});

const body = Source_Sans_3({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ShadowPulse — kiểm tra tín hiệu hạn chế hiển thị",
  description:
    "Quét tín hiệu visibility công khai trên X, Instagram, TikTok, Facebook và Threads. Có confidence. Không verdict bịa.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        <div className="shell min-h-screen">{children}</div>
      </body>
    </html>
  );
}
