'use client'

import { sessionService } from '@/service/session'
import { createContext, useContext } from 'react'

type SessionContextType = Awaited<ReturnType<typeof sessionService.validate>>

const SessionContext = createContext<SessionContextType>({
	session: null,
	user: null,
	customer: null,
})

export const useSession = () => useContext(SessionContext)

export const SessionProvider = ({
	children,
	value,
}: React.PropsWithChildren<{ value: SessionContextType }>) => {
	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	)
}
