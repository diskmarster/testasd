import { Icons } from '@/components/ui/icons'
import { UserRole } from '@/data/user.types'
import { LucideIcon } from 'lucide-react'

export const siteConfig: SiteConfig = {
  name: 'NemLager',
  description: 'Hold styr på din beholdning',
  logo: Icons.boxes,
  errorTitle: 'Der gik noget galt',
  successTitle: 'Handling fuldført',
  navItems: (lng: string = 'dk') => [
    {
      label: 'Oversigt',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/oversigt`,
      roles: [],
    },
    {
      label: 'Historik',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/historik`,
      roles: [],
    },
    {
      label: 'Genbestil',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/genbestil`,
      roles: [],
    },
    {
      label: 'Administration',
      roles: ['sys_admin', 'firma_admin', 'lokal_admin'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Organisation',
          description:
            'Se og rediger i brugere, lokationer og firmainformation',
          href: `/${lng}/admin/organisation`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: 'Produkter',
          description: 'Se, opret og rediger i dine produkter',
          href: `/${lng}/admin/produkter`,
          roles: ['sys_admin', 'firma_admin', 'lokal_admin'],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: 'Varegrupper',
          description: 'Se, opret og rediger i dine varegrupper',
          href: `/${lng}/admin/varegrupper`,
          roles: ['sys_admin', 'firma_admin'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'Placeringer',
          description: 'Se, opret og rediger i dine placeringer',
          href: `/${lng}/admin/placeringer`,
          roles: ['sys_admin', 'firma_admin'],
          isExternal: false,
          isDisabled: false,
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
          label: 'Analytics',
          description: 'Se en oversigt over hvordan systemet bruges',
          href: '/sys/analytics',
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'Kunder',
          description: 'Se en oversigt over alle kunder i Nem Lager',
          href: `/${lng}/sys/kunder`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Brugere',
          description: 'Se en oversigt over alle brugere i Nem Lager',
          href: `/${lng}/sys/brugere`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'Enheder',
          description: 'Se, opret og rediger i de enheder kunderne kan vælge',
          href: `/${lng}/sys/enheder`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'Fejlbeskeder',
          description: 'Se en oversigt over alle fejlbeskeder i Nem Lager',
          href: `/${lng}/sys/fejl`,
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
  navItems: (lng?: string) => NavItem[]
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
