import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

// Swap for the exact font from Figma once known.
const font = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "CRM · График смен",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className={font.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
