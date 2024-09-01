"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Icons } from '@/components/ui/icons'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { User } from 'lucia'
import { usePathname } from 'next/navigation'

export function NavMobile({ user }: { user: User }) {
  const pathname = usePathname()
  return (
    <div className='flex gap-6 md:hidden md:gap-10'>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
            <Icons.menu className='h-5 w-5' />
            <span className='sr-only'>Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left'>
          <nav className='grid gap-4 text-lg font-medium'>
            <SheetClose asChild>
              <Link
                href='/'
                className='flex items-center gap-2 text-lg font-semibold'>
                <siteConfig.logo className='size-6' strokeWidth={1.5} />
                <span className='sr-only'>
                  {siteConfig.name}
                </span>
              </Link>
            </SheetClose>
            {siteConfig.navItems
              .filter(
                item =>
                  item.roles.includes(user.role) || item.roles.length == 0,
              )
              .map((item, index) => {
                if (item.isDropdown) {
                  return (
                    <Collapsible key={index} className='grid gap-2'>
                      <CollapsibleTrigger className={cn('flex items-center justify-between', item.isDisabled && 'cursor-not-allowed pointer-events-none opacity-50')}>
                        <span>{item.label}</span>
                        <Icons.chevronDown className='h-5 w-5 transition-transform' />
                      </CollapsibleTrigger>
                      <CollapsibleContent className='grid gap-2 pl-4'>
                        {item.items.filter(item => item.roles.includes(user.role) || item.roles.length == 0).map((item, index) => (
                          <SheetClose key={index} asChild>
                            <Link
                              href={item.href}
                              className={cn('text-muted-foreground hover:text-foreground', item.isDisabled && 'cursor-not-allowed pointer-events-none opacity-50')}
                              prefetch={false}>
                              {item.label}
                            </Link>
                          </SheetClose>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                } else {
                  return (
                    <SheetClose key={index} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex select-none items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground',
                          item.isDisabled &&
                          'pointer-events-none cursor-not-allowed opacity-60',
                        )}>
                        <span className='relative'>
                          {item.label}
                          {item.isExternal && (
                            <Icons.external className='size-4' />
                          )}
                        </span>
                      </Link>
                    </SheetClose>
                  )
                }
              })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
