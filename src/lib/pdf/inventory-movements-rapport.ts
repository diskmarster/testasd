import { HistoryWithSums } from '@/data/inventory.types'
import * as DateFNs from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate, formatNumber, numberToCurrency } from '../utils'

type MetaData = {
  docTitle: string
  companyName: string
  locationName: string
  userName: string
  dateOfReport: Date
}

type row = {
  sku: string
  text1: string
  group: string
  unit: string
  amount: number
  date: Date
  costPrice: number
  costPriceTotal: number
}

export function genInventoryMovementsExcel(
  historyLines: HistoryWithSums[],
  isSummarized: boolean,
  isWithPrices: boolean,
  t: (key: string, opts?: any) => string,
): XLSX.WorkBook {
  let rows: row[] = []

  if (isSummarized) {
    const summarizedRows: { [key: string]: row } = historyLines.reduce(
      (acc: { [key: string]: row }, curr) => {
        const sku = curr.productSku!
        if (!acc[sku]) {
          acc[sku] = {
            sku: curr.productSku!,
            text1: curr.productText1!,
            group: curr.productGroupName!,
            unit: curr.productUnitName!,
            amount: 0,
            date: curr.inserted!,
            costPrice: curr.productCostPrice!,
            costPriceTotal: 0,
          }
        }

        acc[sku].amount += curr.amount
        acc[sku].costPriceTotal += curr.costTotal

        return acc
      },
      {},
    )

    rows = Object.values(summarizedRows)
  } else {
    rows = historyLines.map(l => ({
      sku: l.productSku!,
      text1: l.productText1!,
      group: l.productGroupName!,
      unit: l.productUnitName!,
      amount: l.amount!,
      type: l.type!,
      date: l.inserted!,
      costPrice: l.productCostPrice!,
      costPriceTotal: l.costTotal!,
    }))
  }

  const lineData = rows.map(r => {
    const line = [r.sku, r.text1, r.group, r.unit, formatNumber(r.amount)]

    if (isWithPrices) {
      line.push(formatNumber(r.costPrice))
      line.push(formatNumber(r.costPriceTotal))
    }

    line.push(DateFNs.formatDate(r.date, 'dd/MM/yy HH:mm'))

    return line
  })

  const lineHeaders = isWithPrices
    ? [
        t('inventory-sum-report.header-sku'),
        t('inventory-sum-report.header-text1'),
        t('inventory-sum-report.header-group'),
        t('inventory-sum-report.header-unit'),
        t('inventory-sum-report.header-amount'),
        t('inventory-sum-report.header-cost-price'),
        t('inventory-sum-report.header-cost-price-total'),
        t('inventory-sum-report.header-date'),
      ]
    : [
        t('inventory-sum-report.header-sku'),
        t('inventory-sum-report.header-text1'),
        t('inventory-sum-report.header-group'),
        t('inventory-sum-report.header-unit'),
        t('inventory-sum-report.header-amount'),
        t('inventory-sum-report.header-date'),
      ]

  const workbook = XLSX.utils.book_new()
  const worksheet1 = XLSX.utils.aoa_to_sheet([
    lineHeaders,
    ...Array.from(lineData),
  ])

  XLSX.utils.book_append_sheet(workbook, worksheet1, 'Lagerværdi', true)

  return workbook
}

export function genSummarizedReportPDF(
  metaData: MetaData,
  historyLines: HistoryWithSums[],
  isSummarized: boolean,
  isWithPrices: boolean,
  itemGroup: string,
  dateRange: { from: Date; to: Date },
  type: string,
  t: (key: string, opts?: any) => string,
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as jsPDF & { lastAutoTable: { finalY: number } }

  doc.setCreationDate(metaData.dateOfReport)
  doc.setProperties({
    title: metaData.docTitle,
  })

  doc.setFontSize(10)
  doc.text(
    t('inventory-sum-report.pdf-title', { location: metaData.locationName }),
    10,
    14,
  )
  doc.text('Nem Lager Rapport', 287, 14, { align: 'right' })

  doc.setLineWidth(0.1)
  doc.setDrawColor(200, 200, 200, 0.5)
  doc.line(10, 18, 287, 18)

  doc.text(t('inventory-sum-report.pdf-company'), 10, 30)
  doc.text(metaData.companyName, 35, 30)

  doc.text(t('inventory-sum-report.pdf-location'), 10, 35)
  doc.text(metaData.locationName, 35, 35)

  doc.text(t('inventory-sum-report.pdf-generated-at'), 227, 30)
  doc.text(formatDate(metaData.dateOfReport), 287, 30, { align: 'right' })

  doc.text(t('inventory-sum-report.pdf-generated-by'), 227, 35)
  doc.text(metaData.userName, 287, 35, { align: 'right' })

  doc.text(t('inventory-sum-report.pdf-filters'), 10, 45)

  doc.text(t('inventory-sum-report.pdf-period'), 10, 50)
  doc.text(
    `${formatDate(dateRange.from, false)} - ${formatDate(dateRange.to, false)}`,
    35,
    50,
  )

  doc.text(t('inventory-sum-report.pdf-summarized'), 10, 55)
  doc.text(
    t('inventory-sum-report.pdf-summarized', {
      context: isSummarized.toString(),
    }),
    35,
    55,
  )

  doc.text(t('inventory-sum-report.pdf-type'), 10, 60)
  doc.text(
    type == 'All' ? t('inventory-sum-report.type-all-label') : type,
    35,
    60,
  )

  doc.text(t('inventory-sum-report.pdf-group'), 10, 65)
  const groups = doc.splitTextToSize(
    itemGroup == 'all'
      ? t('inventory-sum-report.item-group-all-label')
      : itemGroup,
    165,
  )
  const height = (groups.length - 1) * 5
  doc.text(groups, 35, 65)

  let rows: row[] = []

  if (isSummarized) {
    const summarizedRows: { [key: string]: row } = historyLines.reduce(
      (acc: { [key: string]: row }, curr) => {
        const sku = curr.productSku!
        if (!acc[sku]) {
          acc[sku] = {
            sku: curr.productSku!,
            text1: curr.productText1!,
            group: curr.productGroupName!,
            unit: curr.productUnitName!,
            amount: 0!,
            date: curr.inserted!,
            costPrice: curr.productCostPrice!,
            costPriceTotal: curr.costTotal!,
          }
        }

        acc[sku].amount += curr.amount

        return acc
      },
      {},
    )

    rows = Object.values(summarizedRows)
  } else {
    rows = historyLines.map(l => {
      const row: row = {
        sku: l.productSku!,
        text1: l.productText1!,
        group: l.productGroupName!,
        unit: l.productUnitName!,
        amount: l.amount!,
        date: l.inserted!,
        costPrice: l.productCostPrice!,
        costPriceTotal: l.costTotal!,
      }

      return row
    })
  }

  const lineData = rows.map(r => {
    const line = [r.sku, r.text1, r.group, r.unit, formatNumber(r.amount)]

    if (isWithPrices) {
      line.push(numberToCurrency(r.costPrice))
      line.push(numberToCurrency(r.costPriceTotal))
    }

    if (!isSummarized) {
      line.push(DateFNs.formatDate(r.date, 'dd/MM/yy HH:mm'))
    }

    return line
  })

  const lineHeaders = isWithPrices
    ? [
        t('inventory-sum-report.header-sku'),
        t('inventory-sum-report.header-text1'),
        t('inventory-sum-report.header-group'),
        t('inventory-sum-report.header-unit'),
        t('inventory-sum-report.header-amount'),
        t('inventory-sum-report.header-cost-price'),
        t('inventory-sum-report.header-cost-price-total'),
        t('inventory-sum-report.header-date'),
      ]
    : [
        t('inventory-sum-report.header-sku'),
        t('inventory-sum-report.header-text1'),
        t('inventory-sum-report.header-group'),
        t('inventory-sum-report.header-unit'),
        t('inventory-sum-report.header-amount'),
        t('inventory-sum-report.header-date'),
      ]

  if (isSummarized) {
    lineHeaders.pop()
  }

  let columnWidths = isWithPrices
    ? [33, 72, 33, 22, 28, 28, 33, 28]
    : [44, 85, 44, 30, 46, 28]

  if (isSummarized) {
    columnWidths = columnWidths.slice(0, -1)
    const fr = 28 / columnWidths.length
    columnWidths = columnWidths.map(c => c + fr)
  }

  const columnStyles: Record<number, { cellWidth: number }> = {}
  columnWidths.forEach((w, i) => {
    columnStyles[i] = { cellWidth: w }
  })

  const totalCost = rows.reduce((acc, cur) => (acc += cur.costPriceTotal), 0)
  const footer: string[] = new Array<string>(columnWidths.length).fill('', 1)
  footer[0] = 'Total'
  footer[columnWidths.length - 1] = numberToCurrency(totalCost)

  autoTable(doc, {
    head: [lineHeaders],
    body: lineData,
    startY: 75 + height,
    theme: 'grid',
    headStyles: {
      fillColor: [90, 120, 181],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      lineWidth: 0.2,
      lineColor: [141, 155, 183],
      cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
    },
    columnStyles: columnStyles,
    alternateRowStyles: { fillColor: [252, 252, 252] },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
      textColor: [0, 0, 0],
      lineColor: [141, 155, 183],
    },
    rowPageBreak: 'avoid',
    margin: { top: 10, left: 10, right: 0, bottom: 20 },
    foot: isWithPrices ? [footer] : [],
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      lineWidth: 0.2,
      lineColor: [141, 155, 183],
      cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
    },
  })

  const pageCount = doc.internal.pages.length
  for (let i = 1; i < pageCount; i++) {
    doc.setPage(i)
    doc.text(`Side ${i} af ${pageCount - 1}`, 200, 285, {
      align: 'right',
    })
  }

  return doc
}
