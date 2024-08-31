import { Inter } from "next/font/google";
import "../../app/globals.css";
import { ProviderTheme } from "@/components/common/provider-theme";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/context/session";
import { sessionService } from "@/service/auth";

const font = Inter({ subsets: ["latin"] });

export default async function LayoutRoot({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await sessionService.validate()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen antialiased', font.className)}>
        <ProviderTheme
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <SessionProvider value={session}>
            {children}
          </SessionProvider>
        </ProviderTheme>
      </body>
    </html>
  );
}

