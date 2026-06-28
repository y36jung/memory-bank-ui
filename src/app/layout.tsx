import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memory Bank",
  description: "Your personal document memory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`}>
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
