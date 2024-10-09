'use client'

import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from 'lucia'
import Link from 'next/link'

export function NavUser({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='relative size-9 rounded-md'>
          <Avatar className='size-9 border'>
            <AvatarImage src={undefined} alt={`${user.name} avatar`} />
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1'>
            <p className='h-4 overflow-x-hidden text-ellipsis text-sm font-semibold leading-none'>
              {user.name}
            </p>
            <p className='h-4 overflow-x-hidden text-ellipsis text-sm leading-none text-muted-foreground'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/profil'>Min profil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='https://skancode.dk/kontakt/' target='_blank'>
              Få hjælp
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/faq'>F.A.Q</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='focus:text-destructive' asChild>
          <form action={() => signOutAction()}>
            <button className='w-full text-left' type='submit'>
              Log ud
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
