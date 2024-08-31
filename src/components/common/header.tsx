import { sessionService } from "@/service/session";
import { ThemeToggle } from "./theme-toggle";
import { NavUser } from "./nav-user";
import { NavDesktop } from "./nav-desktop";

export async function Header() {
  const { session, user } = await sessionService.validate()
  if (!session) return null

  return (
    <header className='sticky top-0 z-40 w-full border-b bg-background shadow-sm'>
      <div className='container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0'>
        <NavDesktop user={user} />
        <p className="md:hidden">Mobile nav</p>
        <div className='flex flex-1 items-center justify-end space-x-4'>
          <nav className='flex items-center space-x-2'>
            <ThemeToggle />
            <NavUser user={user} />
          </nav>
        </div>
      </div>
    </header>
  )
}
