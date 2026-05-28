import type { Metadata, Viewport } from "next";
import { Alice, DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const alice = Alice({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alice",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FACN - Fast Access Care Network",
  description: "Telemedicine platform for Dire Dawa, Ethiopia",
};

export const viewport: Viewport = {
  themeColor: "#e4ad88",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${alice.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
