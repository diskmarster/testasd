"use client"

import { User } from "lucia";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { NavItem, siteConfig } from "@/config/site";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavDesktop({ user }: { user: User }) {
  const pathname = usePathname()
  return (
    <div className='hidden gap-6 md:flex md:gap-10'>
      <Link href='/' className='flex items-center space-x-2'>
        <Icons.boxes className="size-6" strokeWidth={1.5} />
        <span className='inline-block font-semibold'>
          {siteConfig.name}
        </span>
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          {siteConfig.navItems
            .filter(
              item => item.roles.includes(user.role) || item.roles.length == 0,
            )
            .map((item, index) => (
              <Item key={index} pathname={pathname} item={item} />
            ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

export function Item({ item, pathname }: { item: NavItem, pathname: string }) {
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
        <NavigationMenuTrigger className='gap-1.5 p-2 text-muted-foreground'>
          {item.label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className='grid gap-2 p-2 md:w-[250px]'>
            {item.items.map((link, index) => (
              <li key={index}>
                <NavigationMenuLink asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                      isActive(link.href) && 'bg-muted',
                    )}>
                    <div className='space-y-1.5'>
                      <div className='flex items-center gap-1.5 text-sm font-semibold leading-none'>
                        {link.label}
                        {link.isExternal && (
                          <Icons.external className='size-3' />
                        )}
                      </div>
                      {link.description && (
                        <p className='line-clamp-2 w-full text-xs leading-snug text-muted-foreground'>
                          {link.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>)
  } else {
    return (
      <NavigationMenuItem
        className={cn(
          'relative',
          item.isDisabled &&
          'pointer-events-none cursor-not-allowed select-none opacity-60',
        )}>
        <Link href={item.href} legacyBehavior passHref>
          <NavigationMenuLink
            className={cn(
              navigationMenuTriggerStyle(),
              'gap-1.5 p-2 text-muted-foreground',
              isActive(item.href) && 'bg-muted',
            )}>
            {item.label}
            {item.isExternal && <Icons.external className='size-3' />}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>)
  }
}
