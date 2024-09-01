import { Icons } from "@/components/ui/icons";
import { UserRole } from "@/data/user.types";
import { LucideIcon } from "lucide-react";

export const siteConfig: SiteConfig = {
  name: 'Nem Lager',
  description: 'Hold styr på din beholdning',
  logo: Icons.boxes,
  errorTitle: "Der gik noget galt",
  successTitle: "Handling fuldført",
  navItems: [
    {
      label: 'Lager',
      roles: ['sysadmin', 'admin', 'bruger'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Oversigt',
          description: 'Se en oversigt over hele din beholdning',
          href: '/lager/oversigt',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Tilgang',
          description: 'Opret en tilgang til din beholdning',
          href: '/lager/tilgang',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Afgang',
          description: 'Opret en afgang til fra din beholdning',
          href: '/lager/afgang',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Regulering',
          description: 'Opret en regulering for din beholdning',
          href: '/lager/regulering',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Historik',
          description: 'Se historikken på alle bevægelser i din beholdning',
          href: '/lager/historik',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
      ]
    },
    {
      label: 'Skancode',
      roles: ['sysadmin'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Kunder',
          description: 'Se en oversigt over alle kunder i Nem Lager',
          href: '/sys/kunder',
          roles: ['sysadmin'],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Brugere',
          description: 'Se en oversigt over alle brugere i Nem Lager',
          href: '/sys/brugere',
          roles: ['sysadmin'],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Fejlbeskeder',
          description: 'Se en oversigt over alle fejlbeskeder i Nem Lager',
          href: '/sys/fejl',
          roles: ['sysadmin'],
          isExternal: false,
          isDisabled: true
        },
      ]
    }
  ]
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
