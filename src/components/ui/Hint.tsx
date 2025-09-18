import { HTMLAttributes, PropsWithChildren } from 'react'
import { Icons } from './icons'
import { TooltipWrapper } from './tooltip-wrapper'

interface Props extends PropsWithChildren<HTMLAttributes<SVGSVGElement>> {}

export function Hint({ children, ...props }: Props) {
	return (
		<TooltipWrapper tooltip={children}>
			<Icons.info {...props} />
		</TooltipWrapper>
	)
}
