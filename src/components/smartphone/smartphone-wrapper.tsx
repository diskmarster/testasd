'use client'

import { cn } from '@/lib/utils'
import { HTMLProps, PropsWithChildren } from 'react'
import { SmartphoneBackButton } from './smartphone-back-button'

interface Props extends PropsWithChildren, HTMLProps<HTMLDivElement> {
	title: string
	description?: string
	showBackButton?: boolean
}

export function SmartphoneWrapper({
	children,
	className: classNameProp,
	title,
	description,
	showBackButton = false,
	...props
}: Props) {
	return (
		<div
			className={cn('p-3 pb-9 flex flex-col gap-4 grow', classNameProp)}
			{...props}>
			{showBackButton && <SmartphoneBackButton />}
			<div>
				<div className='flex flex-col'>
					<h1 className='font-medium text-lg'>{title}</h1>
					{description && (
						<p className='text-sm text-muted-foreground'>{description}</p>
					)}
				</div>
			</div>
			<div className='grow flex flex-col gap-2'>{children}</div>
		</div>
	)
}
