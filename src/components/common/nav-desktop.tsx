'use client'

import { useTranslation } from '@/app/i18n/client'
import { Icons } from '@/components/ui/icons'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { NavItem, siteConfig } from '@/config/site'
import { Plan } from '@/data/customer.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { cn, planToBadgeVariant } from '@/lib/utils'
import { User } from 'lucia'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '../ui/badge'
import { NavChip } from './nav-chip'

export function NavDesktop({
  user,
  lng,
  customer,
  customerSettings,
}: {
  user: User
  lng: string
  customer: Customer
  customerSettings: Pick<CustomerSettings, 'usePlacement'>
}) {
  const pathname = usePathname()
  const { t } = useTranslation(lng, 'common')
  return (
    <div className='hidden gap-6 md:flex md:gap-10'>
      <Link href={`/${lng}/oversigt`} className='flex items-center space-x-2'>
        <siteConfig.logo className='size-6 text-primary' strokeWidth={1.5} />
        <span className='inline-block font-semibold'>{siteConfig.name}</span>
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          {siteConfig
            .navItems(lng, customerSettings)
            .filter(
              item => item.roles.includes(user.role) || item.roles.length == 0,
            )
            .map((item, index) => (
              <Item
                key={index}
                pathname={pathname}
                item={item}
                user={user}
                plan={customer.plan}
                t={t}
              />
            ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

function Item({
  item,
  pathname,
  user,
  plan,
  t,
}: {
  item: NavItem
  pathname: string
  user: User
  plan: Plan
  t: (key: string) => string
}) {
  function isActive(path: string): boolean {
    return pathname === path
  }

  if (item.isDropdown) {
    return (
      <NavigationMenuItem
        className={cn(
          'relative',
          item.isDisabled &&
          'pointer-events-none cursor-not-allowed select-none opacity-60',
        )}>
        <NavigationMenuTrigger className='gap-1 p-2 text-muted-foreground'>
          {t(item.label)}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className='grid gap-2 p-2 md:w-[250px]'>
            {item.items
              .filter(
                item =>
                  item.roles.includes(user.role) || item.roles.length == 0,
              )
              .map((link, index) => (
                <li key={index}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                        isActive(link.href) && 'bg-muted',
                        (link.isDisabled ||
                          !hasPermissionByPlan(plan, link.plan ?? 'lite')) &&
                        'pointer-events-none cursor-not-allowed select-none opacity-50',
                      )}>
                      <div className='space-y-1.5'>
                        <div className='flex items-center gap-1.5 text-sm font-semibold leading-none'>
                          {t(link.label)}
                          {!hasPermissionByPlan(plan, link.plan ?? 'lite') ? (
                            <Badge
                              variant={planToBadgeVariant(link.plan ?? 'lite')}
                              className='capitalize'>
                              {link.plan}
                            </Badge>
                          ) : link.isDisabled ? (
                            <Badge variant={'red'}>
                              {t('site-config.link-disabled')}
                            </Badge>
                          ) : (
                            link.isExternal && (
                              <Icons.external className='size-3' />
                            )
                          )}
                        </div>
                        {link.description && (
                          <p className='line-clamp-2 w-full text-xs leading-snug text-muted-foreground'>
                            {t(link.description)}
                          </p>
                        )}
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    )
  } else {
    return (
      <NavigationMenuItem
        className={cn(
          'relative',
          (item.isDisabled ||
            !hasPermissionByPlan(plan, item.plan ?? 'lite')) &&
          'pointer-events-none cursor-not-allowed select-none opacity-50',
        )}>
        <Link href={item.href} legacyBehavior passHref>
          <NavigationMenuLink
            className={cn(
              navigationMenuTriggerStyle(),
              'gap-1.5 p-2 text-muted-foreground',
              isActive(item.href) && 'bg-muted',
            )}>
            {t(item.label)}
            {!hasPermissionByPlan(plan, item.plan ?? 'lite') ? (
              <Badge
                variant={planToBadgeVariant(item.plan ?? 'lite')}
                className='capitalize'>
                {item.plan}
              </Badge>
            ) : item.isDisabled ? (
              <Badge variant={'red'}>{t('site-config.link-disabled')}</Badge>
            ) : (
              item.isExternal && <Icons.external className='size-3' />
            )}
            {item.chipLabel && (
              <Suspense fallback={null}>
                <NavChip
                  chipLabel={item.chipLabel}
                  localeKey={`chip.${item.chipLabel}-chip-tooltip`}
                />
              </Suspense>
            )}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    )
  }
}
