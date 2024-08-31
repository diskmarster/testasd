import { Icons } from "@/components/ui/icons";
import { LucideIcon } from "lucide-react";

export const siteConfig: SiteConfig = {
  name: 'Nem Lager',
  description: 'Hold styr på din beholdning',
  logo: Icons.warehouse,
  navItems: [
    {
      label: 'Oversigt',
      roles: ['admin', 'bruger'],
      isDisabled: false,
      isDropdown: true,
      items: [
        {
          label: 'Beholdning',
          description: 'Se en oversigt over hele din beholdning',
          href: '/oversigt/beholdning'
        },
        {
          label: 'Historik',
          description: 'Se historikken på alle bevægelser på din beholdning',
          href: '/oversigt/histik'
        },
      ]
    },
    {
      label: 'Support',
      roles: ['admin', 'bruger'],
      isDisabled: false,
      isDropdown: false,
      href: '/support'
    }
  ]
}

type SiteConfig = {
  name: string
  description: string
  logo: LucideIcon
  navItems: NavItem[]
}

export type NavItem = NavItemNoDropdown | NavItemDropdown

type NavItemNoDropdown = {
  label: string
  roles: string[],
  isDisabled: boolean,
  isDropdown: false
  href: string
}

type NavItemDropdown = {
  label: string
  roles: string[],
  isDisabled: boolean,
  isDropdown: true
  items: {
    label: string
    description: string
    href: string
  }[]
}
