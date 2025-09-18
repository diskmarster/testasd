import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<'textarea'>
>(({ className, maxLength, ...props }, ref) => {
	return (
		<div className='relative'>
			<textarea
				className={cn(
					'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
					className,
				)}
				maxLength={maxLength}
				ref={ref}
				{...props}
			/>
			{maxLength && (
				<span className={cn('absolute bottom-1 right-2 text-xs tabular-nums')}>
					{props.value?.toString().length} / {maxLength}
				</span>
			)}
		</div>
	)
})
Textarea.displayName = 'Textarea'

export { Textarea }
