import React from 'react'

interface Props extends React.HTMLAttributes<HTMLElement> {
	condition: boolean
	trueComp: React.ReactNode
	falseComp: React.ReactNode
}

export function IfElse({
	condition,
	trueComp,
	falseComp = null,
	...props
}: Props) {
	const Component = condition ? trueComp : falseComp

	return React.isValidElement(Component)
		? React.cloneElement(Component, props)
		: Component
}
