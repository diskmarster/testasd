import { sessionService } from '@/service/session'
import { LanguageSwitcher } from './language-switcher'
import { NavDesktop } from './nav-desktop'
import { NavLocation } from './nav-location'
import { NavMobile } from './nav-mobile'
import { NavUser } from './nav-user'
import { ThemeToggle } from './theme-toggle'

export async function Header({ lng }: { lng: string }) {
  const { session, user } = await sessionService.validate()
  if (!session) return null

  return (
    <header className='sticky top-0 z-40 w-full border-b bg-background shadow-sm'>
      <div className='container flex h-16 items-center md:space-x-4 sm:justify-between'>
        <NavDesktop user={user} lng={lng} />
        <NavMobile user={user} lng={lng} />
        <div className='flex flex-1 items-center justify-end space-x-4'>
          <nav className='flex items-center space-x-2'>
            <LanguageSwitcher lng={lng} />
            <NavLocation />
            <ThemeToggle />
            <NavUser user={user} />
          </nav>
        </div>
      </div>
    </header>
  )
}
