'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings } from 'lucide-react'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

interface NavSettingsProps {
  lng: string
  variant?: 'outline' | 'ghost'
}
export function NavSettings({ lng, variant = 'outline' }: NavSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size='icon' className='aspect-square'>
          <Settings className='h-5 w-5' />
          <span className='sr-only'>Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48' align='end'>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <ThemeToggle />
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <LanguageSwitcher lng={lng} />
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
