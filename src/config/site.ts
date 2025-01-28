import { Icons } from '@/components/ui/icons'
import { UserRole } from '@/data/user.types'
import { t } from 'i18next'
import { LucideIcon } from 'lucide-react'

export const siteConfig: SiteConfig = {
  name: 'NemLager',
  description: 'site-config.description',
  logo: Icons.boxes,
  errorTitle: 'site-config.error-title',
  successTitle: 'site-config.success-title',
  navItems: (lng: string = 'dk') => [
    {
      label: `${t('site-config.overview')}`,
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/oversigt`,
      roles: [],
    },
    {
      label: `${t('site-config.history')}`,
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/historik`,
      roles: [],
    },
    {
      label: `${t('site-config.restock')}`,
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/genbestil`,
      roles: ['system_administrator', 'administrator', 'moderator', 'bruger'],
      chipLabel: 'genbestil',
    },
    {
      label: 'site-config.products-title',
      roles: [],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: `${t('site-config.products-label')}`,
          description:
            'site-config.administration-dropdown.products-description',
          href: `/${lng}/varer/produkter`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: `${t('site-config.groups-label')}`,
          description:
            'site-config.administration-dropdown.product-groups-description',
          href: `/${lng}/varer/varegrupper`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: `${t('site-config.placements-label')}`,
          description: `${t('site-config.administration-dropdown.placements-description')}`,
          href: `/${lng}/varer/placeringer`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: `${t('site-config.batch-label')}`,
          description: `${t('site-config.administration-dropdown.batch-description')}`,
          href: `/${lng}/varer/batch`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },
      ],
    },
    {
      label: 'site-config.organization-title',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/organisation`,
      roles: ['system_administrator', 'administrator', 'moderator'],
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
          description: `${t('site-config.sys-admin-dropdown.customers-description')}`,
          href: `/${lng}/sys/kunder`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: `${t('site-config.sys-admin-dropdown.admin-users')}`,
          description: `${t('site-config.sys-admin-dropdown.admin-users-description')}`,
          href: `/${lng}/sys/brugere`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: `${t('site-config.sys-admin-dropdown.units')}`,
          description: `${t('site-config.sys-admin-dropdown.units-description')}`,
          href: `/${lng}/sys/enheder`,
          roles: ['system_administrator'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: `${t('site-config.sys-admin-dropdown.error-messages')}`,
          description: `${t('site-config.sys-admin-dropdown.error-messages-description')}`,
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
