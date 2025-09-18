'use client'

import { SortingState, Updater } from '@tanstack/react-table'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type HandleSortingChangeFN = (updaterOrValue: Updater<SortingState>) => void

export function useUrlSorting(
	mutableSearchParams: URLSearchParams,
	defaultSorting: SortingState = [],
): [SortingState, HandleSortingChangeFN] {
	const pathname = usePathname()
	const router = useRouter()
	const searchParams = useSearchParams()

	const [sorting, setSorting] = useState<SortingState>(defaultSorting)

	const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
		let updatedState: SortingState
		if (typeof updaterOrValue === 'function') {
			updatedState = updaterOrValue(sorting)
		} else {
			updatedState = updaterOrValue
		}
		if (matches(updatedState, sorting)) {
			return
		}

		//const mutableSearchParams = new URLSearchParams(searchParams)

		if (updatedState.length == 0) {
			mutableSearchParams.delete('sort')
		} else {
			if (!matches(updatedState, defaultSorting)) {
				// parse updatedState and put in url
				const queryParam = updatedState
					.map(state => `${state.id}:${state.desc ? 'desc' : 'asc'}`)
					.join(';')

				mutableSearchParams.set('sort', btoa(queryParam))
			}
		}
		router.push(`${pathname}?${mutableSearchParams.toString()}`, {
			scroll: false,
		})

		setSorting(updatedState)
	}

	useEffect(() => {
		handleSortingChange(
			searchParamToSortingState(searchParams.get('sort'), defaultSorting),
		)
	}, [searchParams])

	return [sorting, handleSortingChange]
}

function matches(a: SortingState, b: SortingState): boolean {
	return (
		a.length == b.length &&
		a
			.map(
				aState => b.find(bState => aState.id == bState.id)?.desc == aState.desc,
			)
			.every(bool => bool == true)
	)
}

function searchParamToSortingState(
	param: string | null,
	defaultValue: SortingState = [],
): SortingState {
	if (param == null) {
		return defaultValue
	}

	param = atob(param)

	const stateStrs = param.split(';')
	const sortingState: SortingState = stateStrs.map(s => {
		const [id, dir] = s.split(':')
		return {
			id,
			desc: dir === 'desc',
		}
	})

	return sortingState
}
