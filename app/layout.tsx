import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kiseokchoi.github.io/plotsift/"),
  title: "PlotSift — Local Graph Digitizer",
  description: "Extract data points, colored series, and Y error bars from scientific graph images locally.",
  applicationName: "PlotSift",
  keywords: ["graph digitizer", "plot digitizer", "error bars", "scientific figures", "data extraction"],
  alternates: { canonical: "." },
  openGraph: {
    title: "PlotSift — Local Graph Digitizer",
    description: "Extract data points, colored series, and Y error bars from scientific graph images locally.",
    type: "website",
    url: ".",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
