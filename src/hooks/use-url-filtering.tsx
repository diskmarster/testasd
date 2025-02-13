import { ColumnFiltersState, Updater } from '@tanstack/react-table'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export type HandleFilterChangeFN = (
  updaterOrValue: Updater<ColumnFiltersState>,
) => void

export function useUrlFiltering(
  defaultFilter: ColumnFiltersState = [],
): [ColumnFiltersState, HandleFilterChangeFN] {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const pathnameRef = useRef(pathname)
  const searchParamsRef = useRef(searchParams)
  const defaultFilterRef = useRef(defaultFilter)
  const columnFiltersRef = useRef(defaultFilter)

  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(defaultFilterRef.current)

  const handleFilterChange = useCallback((updaterOrValue: Updater<ColumnFiltersState>) => {
    let updatedState: ColumnFiltersState
    if (typeof updaterOrValue === 'function') {
      updatedState = updaterOrValue(columnFiltersRef.current)
    } else {
      updatedState = updaterOrValue
    }

    console.log({updatedState, columnFiltersRef: columnFiltersRef.current})
    if (matches(updatedState, columnFiltersRef.current)) {
      return
    }

    const mutableSearchParams = new URLSearchParams(searchParamsRef.current)

    if (updatedState.length == 0) {
      mutableSearchParams.delete('filter')
    } else {
      if (!matches(updatedState, defaultFilterRef.current)) {
        // parse updatedState and put in url
        const queryParam = updatedState
          .map(state => btoa(JSON.stringify(state)))
          .join(';')

        mutableSearchParams.set('filter', btoa(queryParam))
      }
    }
    console.log({mutableSearchParams: mutableSearchParams.toString()})
    router.push(`${pathnameRef.current}?${mutableSearchParams.toString()}`)

    setColumnFilters(updatedState)
    columnFiltersRef.current = updatedState
  }, [router])

  useEffect(() => {
    const initialFilters = searchParamToColumnFiltersState(
      searchParamsRef.current.get('filter'),
      defaultFilterRef.current,
    )
    setColumnFilters(initialFilters)
    columnFiltersRef.current = initialFilters // Ensure ref is up to date
  }, [])

  return [columnFilters, handleFilterChange]
}

function matches(a: ColumnFiltersState, b: ColumnFiltersState): boolean {
  return (
    a.length == b.length &&
    a
      .map(
        aState =>
          b.find(bState => aState.id == bState.id)?.value == aState.value,
      )
      .every(bool => bool == true)
  )
}

function searchParamToColumnFiltersState(
  param: string | null,
  defaultValue: ColumnFiltersState = [],
): ColumnFiltersState {
  if (param == null) {
    return defaultValue
  }

  param = atob(param)

  const filterStrs = param.split(';')
  const filterState = filterStrs.map(s => JSON.parse(atob(s)))

  return filterState
}
