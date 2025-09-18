'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'
import * as React from 'react'

import { cn } from '@/lib/utils'

const DialogV2 = DialogPrimitive.Root

const DialogTriggerV2 = DialogPrimitive.Trigger

const DialogPortalV2 = DialogPrimitive.Portal

const DialogCloseV2 = DialogPrimitive.Close

const DialogOverlayV2 = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className,
		)}
		{...props}
	/>
))
DialogOverlayV2.displayName = DialogPrimitive.Overlay.displayName

const DialogContentV2 = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPortalV2>
		<DialogOverlayV2 />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-md',
				className,
			)}
			{...props}>
			{children}
		</DialogPrimitive.Content>
	</DialogPortalV2>
))
DialogContentV2.displayName = DialogPrimitive.Content.displayName

const DialogHeaderV2 = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex items-center justify-between text-center sm:text-left px-3 py-2.5 border-b',
			className,
		)}
		{...props}>
		{props.children}
		<DialogPrimitive.Close className='rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:bg-accent p-px'>
			<Cross2Icon className='size-4' />
			<span className='sr-only'>Close</span>
		</DialogPrimitive.Close>
	</div>
)
DialogHeaderV2.displayName = 'DialogHeader'

const DialogFooterV2 = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t px-3 py-2.5 bg-accent',
			className,
		)}
		{...props}
	/>
)
DialogFooterV2.displayName = 'DialogFooter'

const DialogTitleV2 = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn('text-sm font-medium leading-none tracking-tight', className)}
		{...props}
	/>
))
DialogTitleV2.displayName = DialogPrimitive.Title.displayName

const DialogDescriptionV2 = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn('text-sm text-muted-foreground', className)}
		{...props}
	/>
))
DialogDescriptionV2.displayName = DialogPrimitive.Description.displayName

export {
	DialogCloseV2,
	DialogContentV2,
	DialogDescriptionV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogOverlayV2,
	DialogPortalV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
}
