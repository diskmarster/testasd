import { type Table } from '@tanstack/react-table'
import { format, isValid } from 'date-fns'

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string
    excludeColumns?: (keyof TData | 'select' | 'actions')[]
    onlySelected?: boolean
    delimiter?: ';' | ','
  } = {}
): void {
  const {
    filename = 'table',
    excludeColumns = [],
    onlySelected = false,
    delimiter = ';',
  } = opts

  const columnMapping: Record<string, string> = {
    'sku': 'Varenr.',
    'barcode': 'Stregkode',
    'group': 'Varegruppe',
    'text1': 'Varetekst 1',
    'text2': 'Varetekst 2',
    'text3': 'Varetekst 3',
    'costPrice': 'Kostpris',
    'salesPrice': 'Salgspris',
    'quantity': 'Beholdning',
    'unit': 'Enhed',
    'placement': 'Placering',
    'batch': 'Batchnr.',
    'updated': 'Sidst opdateret'
  }

  const headers = table
    .getAllLeafColumns()
    .map(column => column.id)
    .filter(id => !excludeColumns.includes(id as keyof TData))

  const headerNames = headers.map(id => columnMapping[id] || id)

  const csvContent = [
    headerNames.join(delimiter),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map(row =>
      headerNames
        .map(headerName => {
          const columnId = Object.keys(columnMapping).find(id => columnMapping[id] === headerName)
          const cellValue = columnId ? row.getValue(columnId) : ''
          if (typeof cellValue != 'number' && isValid(cellValue)) {
            return format(cellValue as Date, 'dd/MM/yyyy HH:mm')
          }
          return typeof cellValue === 'string'
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue
        })
        .join(delimiter),
    ),
  ].join('\n')

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
