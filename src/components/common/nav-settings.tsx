'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings } from 'lucide-react'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

interface NavSettingsProps {
  lng: string
}
export function NavSettings({ lng }: NavSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='aspect-square'>
          <Settings className='size-4' />
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
