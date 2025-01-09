import { type Table } from '@tanstack/react-table'
import { format, isValid } from 'date-fns'

type ExportOptions<TData> = {
  filename?: string
  excludeColumns?: (keyof TData | 'select' | 'actions')[]
  onlySelected?: boolean
  delimiter?: ';' | ','
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: ExportOptions<TData> = {},
): void {
  const {
    filename = 'nemlager_eksport',
    excludeColumns = [],
    onlySelected = false,
    delimiter = ';',
  } = opts

  // Fetch all columns and filter out excluded ones
  const columns = table
    .getAllLeafColumns()
    .filter(column => !excludeColumns.includes(column.id as keyof TData))

  // Generate CSV headers based on the viewLabel from meta, fallback to column id
  const headers = columns.map(column => {
    // @ts-ignore
    const viewLabel = column.columnDef.meta?.viewLabel as string | undefined
    return viewLabel || column.id
  })

  const data = (
    onlySelected
      ? table.getSelectedRowModel().rows
      : table.getState().columnFilters.length == 0
        ? table.getCoreRowModel().rows
        : table.getFilteredRowModel().rows
  ).map(row => columns.map(column => row.getValue(column.id)))

  // Generate rows for the CSV file
  const csvContent = generateCsvContent(headers, data, delimiter)
  // Prepend the BOM for Excel compatibility
  const csvWithBom = '\uFEFF' + csvContent

  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateCsvContent(
  headers: string[],
  data: unknown[][],
  delimiter: string,
): string {
  return [
    headers.join(delimiter),
    ...data.map(row =>
      row
        .map(cellValue => {
          // Check if cellValue is an array of dates or date-like strings
          if (Array.isArray(cellValue) && cellValue[0] instanceof Date) {
            const validDates = cellValue
              .map(date => new Date(date))
              .filter(isValid) // Filter out invalid dates

            if (validDates.length > 0) {
              // Get the latest date from the array
              const latestDate = new Date(
                Math.max(...validDates.map(date => date.getTime())),
              )
              return format(latestDate, 'dd/MM/yyyy HH:mm')
            }
          }
          // If the value is a single valid date, format it
          if (typeof cellValue != 'number' && cellValue instanceof Date) {
            const date = new Date(cellValue)
            if (isValid(date)) {
              return format(date, 'dd/MM/yyyy HH:mm')
            }
          }

          if (typeof cellValue == 'boolean') {
            return cellValue ? 'Ja' : 'Nej'
          }

          const numberFormatter = Intl.NumberFormat('da-DA')
          if (typeof cellValue == 'number') {
            return numberFormatter.format(cellValue)
          }

          // For non-date columns, return the value as it is or escape quotes in strings
          return typeof cellValue === 'string'
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue
        })
        .join(delimiter),
    ),
  ].join('\n')
}
