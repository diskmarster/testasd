import * as XLSX from 'xlsx'

export type ExcelRow = {
  supplierName: string
  sku: string
  barcode: string
  text1: string
  text2: string
  unitName: string
  costPrice: number
  quantity: number
  sum: number
}

export function genReorderExcelWorkbook(
  data: ExcelRow[],
  t: (key: string, opts?: any) => string,
) {
  const headers = [
    t('report.headers.supplier'),
    t('report.headers.sku'),
    t('report.headers.barcode'),
    t('report.headers.text1'),
    t('report.headers.text2'),
    t('report.headers.unit'),
    t('report.headers.costPrice'),
    t('report.headers.quantity'),
    t('report.headers.sum'),
  ]
  const rows = data.map(row => [
    row.supplierName,
    row.sku,
    row.barcode,
    row.text1,
    row.text2,
    row.unitName,
    row.costPrice,
    row.quantity,
    row.sum,
  ])

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  XLSX.utils.book_append_sheet(workbook, worksheet, t('report.sheet'), true)
  return workbook
}
