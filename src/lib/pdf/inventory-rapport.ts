import { FormattedInventory } from '@/data/inventory.types'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate, formatNumber, numberToDKCurrency } from '../utils'

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

export function genInventoryExcel(inventoryLines: FormattedInventory[]) {
  const aggregatedSkus: { [key: string]: Line } = inventoryLines.reduce(
    (acc: { [key: string]: Line }, line) => {
      const sku = line.product.sku

      if (!acc[sku]) {
        acc[sku] = {
          sku: sku,
          text1: line.product.text1,
          group: line.product.group,
          costPrice: line.product.costPrice,
          quantity: 0,
          totalCost: 0,
        }
      }

      acc[sku].quantity += line.quantity
      acc[sku].totalCost += line.product.costPrice * line.quantity

      return acc
    },
    {},
  )
  const lineHeaders = [
    'Varenr.',
    'Varetekst 1',
    'Varegruppe',
    'Kostpris',
    'Antal',
    'Total',
  ]
  const lineData = Object.values(aggregatedSkus)
    .map(l => [
      l.sku,
      l.text1,
      l.group,
      numberToDKCurrency(l.costPrice),
      formatNumber(l.quantity),
      numberToDKCurrency(l.totalCost),
    ])
    .sort((a, b) => {
      const groupA = a[2]
      const groupB = b[2]

      if (groupA < groupB) return -1
      if (groupA > groupB) return 1
      return 0
    })

  const aggregatedGroups: { [key: string]: GroupLine } = Object.values(
    aggregatedSkus,
  ).reduce((acc: { [key: string]: GroupLine }, line) => {
    const group = line.group

    if (!acc[group]) {
      acc[group] = {
        name: group,
        quantity: 0,
        total: 0,
      }
    }

    acc[group].quantity += 1
    acc[group].total += line.totalCost

    return acc
  }, {})

  const groupData = Object.values(aggregatedGroups)
    .map(l => [l.name, formatNumber(l.quantity), numberToDKCurrency(l.total)])
    .sort((a, b) => {
      const groupA = a[0]
      const groupB = b[0]

      if (groupA < groupB) return -1
      if (groupA > groupB) return 1
      return 0
    })

  const groupHeaders = ['Varegruppe', 'Antal varer', 'Lagerværdi']

  const groupColumnWidths = [110, 40, 40]
  const groupHeaderStyles = {
    fillColor: [240, 240, 240],
    textColor: [0],
    fontStyle: 'bold',
  }

  const workbook = XLSX.utils.book_new()
  const worksheet1 = XLSX.utils.aoa_to_sheet([
    lineHeaders,
    ...Array.from(lineData),
  ])

  const worksheet2 = XLSX.utils.aoa_to_sheet([
    groupHeaders,
    ...Array.from(groupData),
  ])

  XLSX.utils.book_append_sheet(workbook, worksheet1, 'Lagerværdi', true)
  XLSX.utils.book_append_sheet(workbook, worksheet2, 'Varegrupper', true)

  const xlFile = XLSX.writeFile(workbook, 'TestExcel.xlsx')

  return xlFile
}

export function genInventoryPDF(
  metaData: MetaData,
  inventoryLines: FormattedInventory[],
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
  })

  const totalValuation = inventoryLines.reduce((total, cur) => {
    const lineTotal = cur.product.costPrice * cur.quantity
    total += lineTotal
    return total
  }, 0)

  doc.setCreationDate(metaData.dateOfReport)
  doc.setProperties({
    title: metaData.docTitle,
  })

  doc.setFontSize(10)
  doc.text('Lagerværdi', 10, 14)
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

  doc.text(
    `Lagerværdi for ${metaData.locationName}: ${numberToDKCurrency(totalValuation)}`,
    10,
    50,
  )

  const aggregatedSkus: { [key: string]: Line } = inventoryLines.reduce(
    (acc: { [key: string]: Line }, line) => {
      const sku = line.product.sku

      if (!acc[sku]) {
        acc[sku] = {
          sku: sku,
          text1: line.product.text1,
          group: line.product.group,
          costPrice: line.product.costPrice,
          quantity: 0,
          totalCost: 0,
        }
      }

      acc[sku].quantity += line.quantity
      acc[sku].totalCost += line.product.costPrice * line.quantity

      return acc
    },
    {},
  )

  const aggregatedGroups: { [key: string]: GroupLine } = Object.values(
    aggregatedSkus,
  ).reduce((acc: { [key: string]: GroupLine }, line) => {
    const group = line.group

    if (!acc[group]) {
      acc[group] = {
        name: group,
        quantity: 0,
        total: 0,
      }
    }

    acc[group].quantity += 1
    acc[group].total += line.totalCost

    return acc
  }, {})

  const groupData = Object.values(aggregatedGroups)
    .map(l => [l.name, formatNumber(l.quantity), numberToDKCurrency(l.total)])
    .sort((a, b) => {
      const groupA = a[0]
      const groupB = b[0]

      if (groupA < groupB) return -1
      if (groupA > groupB) return 1
      return 0
    })

  const groupHeaders = ['Varegruppe', 'Antal varer', 'Lagerværdi']

  const groupColumnWidths = [110, 40, 40]
  const groupHeaderStyles = {
    fillColor: [240, 240, 240],
    textColor: [0],
    fontStyle: 'bold',
  }

  // @ts-ignore
  doc.autoTable({
    head: [groupHeaders],
    body: groupData,
    startY: 60,
    theme: 'grid',
    headStyles: {
      fillColor: groupHeaderStyles.fillColor,
      textColor: groupHeaderStyles.textColor,
      fontStyle: groupHeaderStyles.fontStyle,
      fontSize: 9,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: groupColumnWidths[0] },
      1: { cellWidth: groupColumnWidths[1] },
      2: { cellWidth: groupColumnWidths[2] },
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 1, right: 4, bottom: 1, left: 1 },
      textColor: [0, 0, 0],
      rowPageBreak: 'avoid',
    },
    margin: { top: 10, left: 10, right: 0, bottom: 20 },
  })

  const lineData = Object.values(aggregatedSkus)
    .map(l => [
      l.sku,
      l.text1,
      l.group,
      numberToDKCurrency(l.costPrice),
      formatNumber(l.quantity),
      numberToDKCurrency(l.totalCost),
    ])
    .sort((a, b) => {
      const groupA = a[2]
      const groupB = b[2]

      if (groupA < groupB) return -1
      if (groupA > groupB) return 1
      return 0
    })

  const lineHeaders = [
    'Varenr.',
    'Varetekst 1',
    'Varegruppe',
    'Kostpris',
    'Antal',
    'Total',
  ]

  const columnWidths = [30, 65, 25, 25, 20, 25]
  const headerStyles = {
    fillColor: [240, 240, 240],
    textColor: [0],
    fontStyle: 'bold',
  }

  // @ts-ignore
  doc.autoTable({
    head: [lineHeaders],
    body: lineData,
    // @ts-ignore
    startY: Math.floor(doc.lastAutoTable.finalY + 10),
    theme: 'grid',
    headStyles: {
      fillColor: headerStyles.fillColor,
      textColor: headerStyles.textColor,
      fontStyle: headerStyles.fontStyle,
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
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 1, right: 4, bottom: 1, left: 1 },
      textColor: [0, 0, 0],
      rowPageBreak: 'avoid',
    },
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
