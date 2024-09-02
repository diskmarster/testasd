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
      label: 'Oversigt',
      isDisabled: false,
      isDropdown: false,
      isExternal: false,
      href: "/oversigt",
      roles: []
    },
    {
      label: 'Registrer',
      roles: ['sysadmin', 'admin', 'bruger'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Tilgang',
          description: 'Opret en tilgang til din vare beholdning',
          href: '/registrer/tilgang',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Afgang',
          description: 'Opret en afgang til fra din vare beholdning',
          href: '/registrer/afgang',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Regulering',
          description: 'Opret en regulering for din vare beholdning',
          href: '/registrer/regulering',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Flyt',
          description: 'Flyt en vare fra en placering til en anden placering',
          href: '/registrer/flyt',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
      ]
    },
    {
      label: 'Genbestil',
      isDisabled: true,
      isDropdown: false,
      isExternal: false,
      href: "/genbestil",
      roles: []
    },
    {
      label: 'Administration',
      roles: ['sysadmin', 'admin'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Brugere',
          description: 'Se en oversigt over alle brugere',
          href: '/sys/kunder',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Varegrupper',
          description: 'Se, opret og rediger i dine varegrupper',
          href: '/sys/brugere',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Placeringer',
          description: 'Se, opret og rediger i dine placeringer',
          href: '/sys/fejl',
          roles: [],
          isExternal: false,
          isDisabled: true
        },
        {
          label: 'Lokationer',
          description: 'Se, opret og rediger i dine lokationer',
          href: '/sys/fejl',
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
