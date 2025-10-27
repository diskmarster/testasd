'use client'

import { useLanguage } from '@/context/language'
import Link from 'next/link'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NavFAQ() {
	const lng = useLanguage()
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size='icon' className='aspect-square'>
					<Icons.help className="size-4" />
					<span className='sr-only'>Settings</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className='w-48' align='end'>
				<DropdownMenuItem asChild>
					<Link target="_blank" href={`/${lng}/faq`}>Oftest stillede spørgsmål</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
