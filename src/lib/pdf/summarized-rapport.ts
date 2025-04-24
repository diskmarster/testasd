import { fallbackLng, I18NLanguage } from '@/app/i18n/settings'
import { HistoryWithSums } from '@/data/inventory.types'
import * as DateFNs from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate, formatNumber } from '../utils'

type MetaData = {
  docTitle: string
  companyName: string
  locationName: string
  userName: string
  dateOfReport: Date
}

type Line = {
  sku: string
  text1: string
  group: string
  costPrice: number
  quantity: number
  totalCost: number
}

type GroupLine = {
  name: string
  quantity: number
  total: number
}

type row = {
  sku: string
  text1: string
  group: string
  unit: string
  amount: number
  date: Date
}

export function genInventoryMovementsExcel(
  historyLines: HistoryWithSums[],
  isSummarized: boolean,
  lng: I18NLanguage = fallbackLng,
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
            amount: 0!,
            date: curr.inserted!,
          }
        }

        acc[sku].amount += curr.amount

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
    }))
  }

  const lineData = rows.map(r => [
    r.sku,
    r.text1,
    r.group,
    r.unit,
    formatNumber(r.amount),
    DateFNs.formatDate(r.date, 'dd/MM/yy HH:mm'),
  ])

  const lineHeaders = [
    'Varenr.',
    'Varetekst 1',
    'Varegruppe',
    'Enhed',
    'Antal',
    'Dato',
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
  itemGroup: string,
  dateRange: { from: Date; to: Date },
  lng: I18NLanguage = fallbackLng,
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
  })

  doc.setCreationDate(metaData.dateOfReport)
  doc.setProperties({
    title: metaData.docTitle,
  })

  doc.setFontSize(10)
  doc.text(`Lagerbevægelser for ${metaData.locationName}`, 10, 14)
  doc.text('Nem Lager Rapport', 200, 14, { align: 'right' })

  doc.setLineWidth(0.1)
  doc.setDrawColor(200, 200, 200, 0.5)
  doc.line(10, 18, 200, 18)

  doc.text('Firma:', 10, 30)
  doc.text(metaData.companyName, 35, 30)
  doc.text('Lokation:', 10, 35)
  doc.text(metaData.locationName, 35, 35)
  doc.text('Genereret den:', 140, 30)
  doc.text(formatDate(metaData.dateOfReport), 200, 30, { align: 'right' })
  doc.text('Genereret af:', 140, 35)
  doc.text(metaData.userName, 200, 35, { align: 'right' })

  doc.text('Filtreringer:', 10, 50)
  doc.text('Periode', 10, 55)
  doc.text(
    `${formatDate(dateRange.from, false)} - ${formatDate(dateRange.to, false)}`,
    35,
    55,
  )
  doc.text(`Varegrupper:`, 10, 60)
  doc.text(itemGroup, 35, 60)
  doc.text(`Summeret:`, 10, 65)
  doc.text(isSummarized ? 'Ja' : 'Nej', 35, 65)

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
          }
        }

        acc[sku].amount += curr.amount

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
    }))
  }

  const lineData = rows.map(r => [
    r.sku,
    r.text1,
    r.group,
    r.unit,
    formatNumber(r.amount),
    DateFNs.formatDate(r.date, 'dd/MM/yy HH:mm'),
  ])

  const lineHeaders = [
    'Varenr.',
    'Varetekst 1',
    'Varegruppe',
    'Enhed',
    'Antal',
    'Dato',
  ]

  const columnWidths = [24, 74, 28, 17, 22, 26]

  autoTable(doc, {
    head: [lineHeaders],
    body: lineData,
    startY: 75,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: columnWidths[0] },
      1: { cellWidth: columnWidths[1] },
      2: { cellWidth: columnWidths[2] },
      3: { cellWidth: columnWidths[3] },
      4: { cellWidth: columnWidths[4] },
      5: { cellWidth: columnWidths[5] },
      6: { cellWidth: columnWidths[6] },
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
      textColor: [0, 0, 0],
    },
    rowPageBreak: 'avoid',
    margin: { top: 10, left: 10, right: 0, bottom: 20 },
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
