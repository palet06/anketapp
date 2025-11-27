import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistMono = localFont({
  src: "../public/fonts/GeistMono-Regular.ttf",
  variable: "--font-geist-mono",
});
const geistSans = localFont({
  src: "../public/fonts/Geist-Regular.ttf",
  variable: "--font-geist",
});
const dmSans = localFont({
  src: "../public/fonts/DMSans-Regular.ttf",
  variable: "--font-dmSans",
});

export const metadata: Metadata = {
  title: "AnketApp",
  description: "Veriye Dayalı Kararlar, Gerçek Sonuçlar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${geistSans.style.fontFamily};
  --font-sans: ${geistSans.variable};
  --font-mono: ${geistMono.variable};
  --font-dm-sans: ${dmSans.variable};
}
        `}</style>
      </head>
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
