import { ProviderTheme } from '@/components/common/provider-theme'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/context/session'
import { cn } from '@/lib/utils'
import { sessionService } from '@/service/session'
import { Inter } from 'next/font/google'
import '../../app/globals.css'

const font = Inter({ subsets: ['latin'] })

export default async function LayoutRoot({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await sessionService.validate()
	return (
		<html lang='en' suppressHydrationWarning>
			<body className={cn('min-h-screen antialiased', font.className)}>
				<ProviderTheme
					attribute='class'
					defaultTheme='light'
					disableTransitionOnChange>
					<SessionProvider value={session}>{children}</SessionProvider>
				</ProviderTheme>
				<Toaster position='bottom-right' duration={4000} closeButton />
			</body>
		</html>
	)
}
