import { Icons } from '@/components/ui/icons'
import { UserRole } from '@/data/user.types'
import { LucideIcon } from 'lucide-react'

export const siteConfig: SiteConfig = {
  name: 'NemLager',
  description: 'site-config.description',
  logo: Icons.boxes,
  errorTitle: 'site-config.error-title',
  successTitle: 'site-config.success-title',
  navItems: (lng: string = 'dk') => [
    {
      label: 'site-config.overview',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/oversigt`,
      roles: [],
    },
    {
      label: 'site-config.history',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/historik`,
      roles: [],
    },
    {
      label: 'site-config.restock',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/genbestil`,
      roles: ['system_administrator', 'administrator', 'moderator', 'bruger'],
      chipLabel: 'genbestil',
    },
    {
      label: 'Administration',
      roles: ['system_administrator', 'administrator', 'moderator'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Organisation',
          description: 'site-config.administration-dropdown.organisation-description',
          href: `/${lng}/admin/organisation`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: 'site-config.administration-dropdown.products',
          description: 'site-config.administration-dropdown.products-description',
          href: `/${lng}/admin/produkter`,
          roles: ['system_administrator', 'administrator', 'moderator'],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: 'site-config.administration-dropdown.product-groups',
          description:  'site-config.administration-dropdown.product-groups-description',
          href: `/${lng}/admin/varegrupper`,
          roles: ['system_administrator', 'administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'site-config.administration-dropdown.placements',
          description: 'site-config.administration-dropdown.placements-description',
          href: `/${lng}/admin/placeringer`,
          roles: ['system_administrator', 'administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'site-config.administration-dropdown.batch',
          description: 'site-config.administration-dropdown.batch-description',
          href: `/${lng}/admin/batch`,
          roles: ['system_administrator', 'administrator', 'moderator'],
          isExternal: false,
          isDisabled: false,
        },
      ],
    },
    {
      label: 'Skancode',
      roles: ['system_administrator'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Analytics',
          description: 'Se en oversigt over hvordan systemet bruges',
          href: `/${lng}/sys/analytics`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'site-config.sys-admin-dropdown.customers',
          description: 'site-config.sys-admin-dropdown.customers-description',
          href: `/${lng}/sys/kunder`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'site-config.sys-admin-dropdown.admin-users',
          description: 'site-config.sys-admin-dropdown.admin-users-description',
          href: `/${lng}/sys/brugere`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: 'site-config.sys-admin-dropdown.units',
          description: 'site-config.sys-admin-dropdown.units-description',
          href: `/${lng}/sys/enheder`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: 'site-config.sys-admin-dropdown.error-messages',
          description: 'site-config.sys-admin-dropdown.error-messages-description',
          href: `/${lng}/sys/fejlbeskeder`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
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
  chipLabel?: string
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
