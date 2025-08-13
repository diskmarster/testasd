import { InventoryAction } from '@/data/inventory.types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import autoTable from 'jspdf-autotable'
import { formatDate } from '../utils'

type Metadata = {
	docTitle: string
	userName: string
	locationName: string
	dateOfReport: Date
}

export function genStockMovementPDF(
	meta: Metadata,
	inventoryActions: InventoryAction[],
): jsPDF {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
	})

	doc.setCreationDate(meta.dateOfReport)
	doc.setProperties({
		title: meta.docTitle,
	})

	doc.setFontSize(10)
	doc.text(`Lagerbevægelser ${formatDate(meta.dateOfReport, false)}`, 10, 14)
	doc.text('Nem Lager Rapport', 200, 14, { align: 'right' })

	doc.setLineWidth(0.1)
	doc.setDrawColor(200, 200, 200, 0.5)
	doc.line(10, 18, 200, 18)

	doc.text('Bruger:', 10, 30)
	doc.text(meta.userName, 35, 30)
	doc.text('Lokation:', 10, 35)
	doc.text(meta.locationName, 35, 35)

	autoTable(doc, {
		head: [
			{
				name: { content: 'Varenavn' },
				sku: { content: 'Varenummer' },
				type: { content: 'Type' },
				amount: { content: 'Antal', styles: { halign: 'right' } },
			},
		],
		body: inventoryActions.map(a => ({
			name: a.productText1,
			sku: a.productSku,
			type: `${a.type.slice(0, 1).toUpperCase()}${a.type.slice(1)}`,
			amount: a.amount,
		})),
		startY: 40,
		headStyles: {
			fillColor: [240, 240, 240],
			textColor: 0,
			fontStyle: 'bold',
			fontSize: 9,
			cellPadding: { top: 1, right: 4, bottom: 1, left: 1 },
		},
		columnStyles: {
			name: { cellWidth: 95 },
			sku: { cellWidth: 50 },
			type: { cellWidth: 30 },
			amount: { cellWidth: 15, halign: 'right' },
		},
		alternateRowStyles: { fillColor: 250, textColor: 0 },
		bodyStyles: {
			fontSize: 9,
			cellPadding: { top: 1, right: 4, bottom: 1, left: 1 },
			textColor: 0,
		},
		rowPageBreak: 'avoid',
		margin: { top: 10, left: 10, right: 0, bottom: 0 },
	})

	return doc
}
