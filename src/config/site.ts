import { Icons } from '@/components/ui/icons'
import { UserRole } from '@/data/user.types'
import { t } from 'i18next'
import { LucideIcon } from 'lucide-react'

export const siteConfig: SiteConfig = {
  name: 'NemLager',
  description: t('site-config.description'),
  logo: Icons.boxes,
  errorTitle: 'site-config.error-title',
  successTitle: 'site-config.success-title',
  navItems: (lng: string = 'dk') => [
    {
      label: t('site-config.overview'),
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/oversigt`,
      roles: [],
    },
    {
      label: t('site-config.history'),
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: `/${lng}/historik`,
      roles: [],
    },
    {
      label: t('site-config.restock'),
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
          description: t(
            'site-config.administration-dropdown.organisation-description',
          ),
          href: `/${lng}/admin/organisation`,
          roles: [],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: t('site-config.administration-dropdown.products'),
          description: t(
            'site-config.administration-dropdown.products-description',
          ),
          href: `/${lng}/admin/produkter`,
          roles: ['sys_admin', 'firma_admin', 'lokal_admin'],
          isExternal: false,
          isDisabled: false,
        },

        {
          label: t('site-config.administration-dropdown.product-groups'),
          description: t(
            'site-config.administration-dropdown.product-groups-description',
          ),
          href: `/${lng}/admin/varegrupper`,
          roles: ['sys_admin', 'firma_admin'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: t('site-config.administration-dropdown.placements'),
          description: t(
            'site-config.administration-dropdown.placements-description',
          ),
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
          href: `/${lng}/sys/analytics`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: t('site-config.sys-admin-dropdown.customers'),
          description: t(
            'site-config.sys-admin-dropdown.customers-description',
          ),
          href: `/${lng}/sys/kunder`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: t('site-config.sys-admin-dropdown.admin-users'),
          description: t(
            'site-config.sys-admin-dropdown.admin-users-description',
          ),
          href: `/${lng}/sys/brugere`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: true,
        },
        {
          label: t('site-config.sys-admin-dropdown.units'),
          description: t('site-config.sys-admin-dropdown.units-description'),
          href: `/${lng}/sys/enheder`,
          roles: ['sys_admin'],
          isExternal: false,
          isDisabled: false,
        },
        {
          label: t('site-config.sys-admin-dropdown.error-messages'),
          description: t(
            'site-config.sys-admin-dropdown.error-messages-description',
          ),
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
