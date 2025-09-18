import { Skeleton } from '../ui/skeleton'

export function SkeletonTable() {
	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<Skeleton className='h-9 w-[122px]' />
				<div className='gap-2 flex items-center'>
					<Skeleton className='size-9' />
					<Skeleton className='size-9' />
					<Skeleton className='size-9' />
				</div>
			</div>
			<div className='h-fit overflow-y-hidden flex flex-col rounded'>
				{Array.from({ length: 15 }, (_, i) => i).map(v => (
					<Skeleton key={v} className='h-10 rounded-none border border-muted' />
				))}
			</div>
			<div className='flex items-center justify-between'>
				<Skeleton className='h-9 w-20' />
				<div className='gap-2 flex items-center'>
					<Skeleton className='size-9' />
					<Skeleton className='size-9' />
				</div>
			</div>
		</div>
	)
}
