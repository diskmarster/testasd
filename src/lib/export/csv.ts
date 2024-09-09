import { type Table } from '@tanstack/react-table'
import { format, isValid } from 'date-fns'

export function exportTableToCSV<TData>(
  /**
   * The table to export.
   * @type Table<TData>
   */
  table: Table<TData>,
  opts: {
    /**
     * The filename for the CSV file.
     * @default "table"
     * @example "tasks"
     */
    filename?: string
    /**
     * The columns to exclude from the CSV file.
     * @default []
     * @example ["select", "actions"]
     */
    excludeColumns?: (keyof TData | 'select' | 'actions')[]

    /**
     * Whether to export only the selected rows.
     * @default false
     */
    onlySelected?: boolean
    delimiter?: ';' | ','
  } = {},
): void {
  const {
    filename = 'table',
    excludeColumns = [],
    onlySelected = false,
    delimiter = ';',
  } = opts

  // Retrieve headers (column names)
  const headers = table
    .getAllLeafColumns()
    .map(column => column.id)
    .filter(id => !excludeColumns.includes(id as keyof TData))

  // Build CSV content
  const csvContent = [
    headers.join(delimiter),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map(row =>
      headers
        .map(header => {
          const cellValue = row.getValue(header)
          if (typeof cellValue != 'number' && isValid(cellValue)) {
            return format(cellValue as Date, 'dd/MM/yyyy HH:mm')
          }
          // Handle values that might contain commas or newlines
          return typeof cellValue === 'string'
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue
        })
        .join(delimiter),
    ),
  ].join('\n')

  // Create a Blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  // Create a link and trigger the download
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
