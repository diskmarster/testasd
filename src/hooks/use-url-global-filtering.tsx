import { Updater } from '@tanstack/react-table'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export type HandleFilterChangeFN = (updaterOrValue: Updater<string>) => void

export function useUrlGlobalFiltering(
	mutableSearchParams: URLSearchParams,
	defaultFilter: string = '',
): [string, HandleFilterChangeFN] {
	const pathname = usePathname()
	const router = useRouter()
	const searchParams = useSearchParams()

	const pathnameRef = useRef(pathname)
	const defaultFilterRef = useRef(defaultFilter)
	const globalFiltersRef = useRef(defaultFilter)

	const [globalFilters, setGlobalFilters] = useState<string>(defaultFilter)

	const handleFilterChange = useCallback(
		(updaterOrValue: Updater<string>) => {
			let updatedState: string

			if (typeof updaterOrValue == 'function') {
				updatedState = updaterOrValue(globalFiltersRef.current)
			} else {
				updatedState = updaterOrValue
			}

			if (updatedState == globalFiltersRef.current) {
				return
			}

			//const mutableSearchParams = new URLSearchParams(searchParams)

			if (updatedState == '') {
				mutableSearchParams.delete('global')
			} else {
				mutableSearchParams.set('global', updatedState)
			}
			router.push(`${pathnameRef.current}?${mutableSearchParams.toString()}`, {
				scroll: false,
			})

			setGlobalFilters(updatedState)
			globalFiltersRef.current = updatedState
		},
		[router, searchParams],
	)

	useEffect(() => {
		const initialFilters = searchParamToGlobalFilters(
			searchParams.get('global'),
			defaultFilterRef.current,
		)
		setGlobalFilters(initialFilters)
		globalFiltersRef.current = initialFilters
	}, [])

	return [globalFilters, handleFilterChange]
}

function searchParamToGlobalFilters(
	param: string | null,
	defaultValue: string = '',
): string {
	if (param == null) {
		return defaultValue
	}

	const globalFilter = param

	return globalFilter
}
