import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../app/globals.css";
import { ProviderTheme } from "@/components/common/provider-theme";

const font = Inter({ subsets: ["latin"] });

export default function LayoutRoot({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ProviderTheme
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ProviderTheme>
      </body>
    </html>
  );
}

