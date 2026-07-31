import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Parrot • Customer Support, Built for Your Team",
    template: "%s • Parrot",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  description: "Parrot is a multi-tenant customer support and live chat platform. Give your team the tools to support customers through conversations, tickets, and an embeddable widget.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-white text-black dark:bg-[#1a1a1a] dark:text-white transition-colors duration-200 selection:bg-neutral-200 dark:selection:bg-[#333333]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
