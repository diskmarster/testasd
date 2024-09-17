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
    // Assert that the columnDef might contain 'meta' with a 'viewLabel'
    const viewLabel = (column.columnDef as any).meta?.viewLabel
    return viewLabel || column.id
  })

  // Generate rows for the CSV file
  const csvContent = [
    headers.join(delimiter),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map(row =>
      columns
        .map(column => {
          const cellValue = row.getValue(column.id)

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

          // For non-date columns, return the value as it is or escape quotes in strings
          return typeof cellValue === 'string'
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue
        })
        .join(delimiter),
    ),
  ].join('\n')

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
