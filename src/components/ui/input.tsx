import { cn } from '@/lib/utils'
import * as React from 'react'
import { Icons } from './icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	tooltip?: {
		condition: boolean
		icon?: React.ReactNode
		content: React.ReactNode
	}
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, tooltip, ...props }, ref) => {
		const inputElement = (
			<input
				type={type}
				className={cn(
					'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
					className,
				)}
				ref={ref}
				{...props}
			/>
		)

		if (!tooltip) return inputElement

		return (
			<div className='relative'>
				{inputElement}
				{tooltip.condition && (
					<TooltipProvider>
						<Tooltip delayDuration={250}>
							<TooltipTrigger asChild>
								<div className='absolute right-2 top-1/2 -translate-y-1/2'>
									{tooltip.icon ?? (
										<Icons.help className='size-4 text-muted-foreground' />
									)}
								</div>
							</TooltipTrigger>
							<TooltipContent className='bg-foreground text-background'>
								{typeof tooltip.content === 'string' ? (
									<p>{tooltip.content}</p>
								) : (
									tooltip.content
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
		)
	},
)

Input.displayName = 'Input'

export { Input }
