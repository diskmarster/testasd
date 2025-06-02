"use client"

import { flexRender, HeaderGroup } from "@tanstack/react-table"
import { TableHead, TableRow } from "../ui/table"

interface Props<T> {
	headerGroup: HeaderGroup<T>
}

export function TableHeaderGroup<T>({headerGroup}: Props<T>) {
	return (
		<TableRow>
			{headerGroup.headers.map(header => (
				// @ts-ignore
				!header.getContext().column.columnDef.meta?.isShadow &&
				<TableHead key={header.id}
					align={
							/* @ts-ignore*/
							header.column.columnDef.meta?.rightAlign 
								? 'right' 
								: 'left'
						}>
					{header.isPlaceholder
						? null
						: flexRender(
							header.column.columnDef.header,
							header.getContext(),
						)}
				</TableHead>
			))}
		</TableRow>
	)
}
