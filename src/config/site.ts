import { Icons } from '@/components/ui/icons'
import { UserRole } from '@/data/user.types'
import { LucideIcon } from 'lucide-react'

export const siteConfig: SiteConfig = {
  name: 'NemLager',
  description: 'Hold styr på din beholdning',
  logo: Icons.boxes,
  errorTitle: 'Der gik noget galt',
  successTitle: 'Handling fuldført',
  navItems: [
    {
      label: 'Oversigt',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: '/oversigt',
      roles: [],
    },
    {
      label: 'Historik',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: '/historik',
      roles: [],
    },
    {
      label: 'Genbestil',
      isDisabled: true,
      isDropdown: false,
      isExternal: false,
      href: '/genbestil',
      roles: [],
    },
    {
      label: 'Administration',
      roles: ['sys_admin', 'firma_admin', 'lokal_admin'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Brugere',
          description: 'Se en oversigt over alle brugere',
          href: '/admin/brugere',
          roles: [],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Produkter',
          description: 'Se, opret og rediger i dine produkter',
          href: '/admin/produkter',
          roles: ['sys_admin', 'firma_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Varegrupper',
          description: 'Se, opret og rediger i dine varegrupper',
          href: '/admin/varegrupper',
          roles: ['sys_admin', 'firma_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Placeringer',
          description: 'Se, opret og rediger i dine placeringer',
          href: '/admin/placeringer',
          roles: ['sys_admin', 'firma_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Lokationer',
          description: 'Se, opret og rediger i dine lokationer',
          href: '/admin/lokationer',
          roles: [],
          isExternal: false,
          isDisabled: true,
        },
      ],
    },
    {
      label: 'Skancode',
      roles: ['sys_admin'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Kunder',
          description: 'Se en oversigt over alle kunder i Nem Lager',
          href: '/sys/kunder',
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Brugere',
          description: 'Se en oversigt over alle brugere i Nem Lager',
          href: '/sys/brugere',
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Fejlbeskeder',
          description: 'Se en oversigt over alle fejlbeskeder i Nem Lager',
          href: '/sys/fejl',
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
      ],
    },
  ],
}

type SiteConfig = {
  name: string
  description: string
  logo: LucideIcon
  errorTitle: string
  successTitle: string
  navItems: NavItem[]
}

export type NavItem = NavItemNoDropdown | NavItemDropdown

type NavItemNoDropdown = {
  label: string
  roles: UserRole[]
  isExternal: boolean
  isDisabled: boolean
  isDropdown: false
  href: string
}

type NavItemDropdown = {
  label: string
  roles: UserRole[]
  isDisabled: boolean
  isDropdown: true
  items: {
    label: string
    description: string
    href: string
    roles: UserRole[]
    isExternal: boolean
    isDisabled: boolean
  }[]
}
