import { NavDesktop } from './nav-desktop'
import { NavLocation } from './nav-location'
import { NavMobile } from './nav-mobile'
import { NavSettings } from './nav-settings'
import { NavUser } from './nav-user'
import { NavFAQ } from './nav-faq'
import { Customer } from '@/lib/database/schema/customer'
import { User } from '@/lib/database/schema/auth'
import { customerService } from '@/service/customer'

export async function Header({ lng, user, customer }: { lng: string, user: User, customer: Customer }) {
  const customerSettings = await customerService.getSettings(customer.id)

  return (
    <header className='sticky top-0 z-[100] w-full border-b bg-background shadow-sm'>
      <div className='container flex h-16 items-center md:space-x-4 sm:justify-between'>
        <NavDesktop user={user} lng={lng} customer={customer} customerSettings={customerSettings ?? {usePlacement:true, useBatch: true}} />
        <NavMobile user={user} lng={lng} />
        <div className='flex flex-1 items-center justify-end space-x-4'>
          <nav className='flex items-center space-x-2'>
            <NavLocation />
            <NavSettings lng={lng} />
            <NavFAQ />
            <NavUser user={user} />
          </nav>
        </div>
      </div>
    </header>
  )
}
