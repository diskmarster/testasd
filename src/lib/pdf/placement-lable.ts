import jsPDF from 'jspdf'
import { truncate } from '../utils'
import { createYadom } from '../yadom'
import { ImageFormat } from '../yadom/types'

export type PlacementLabel = {
	name: string
}

type LabelSize = [number, number]

export const placementLabelSizes: Record<string, LabelSize> = {
	small: [51, 26],
	medium: [76, 51],
	large: [152, 100],
	xlarge: [192, 100],
} as const

function calculateLayout(size: LabelSize) {
	const [width, height] = size
	const baseWidth = 76
	const baseHeight = 51

	const scaleW = width / baseWidth
	const scaleH = height / baseHeight
	const scale = Math.min(scaleW, scaleH)

	return {
		fonts: {
			name: Math.max(11, Math.min(16, 14 * scale)),
			barcodeText: Math.max(6, Math.min(10, 8 * scale)),
		},
		paddingY: Math.max(2, 3 * scale),
		paddingX: Math.max(2, 3 * scale),
		barcodeSize: Math.min(width, height) * 0.5,
		spacing: Math.max(1, 1.5 * scale),
	}
}

/**
 * Generates a ready-to-print PDF document for the provided products.
 * Function is async because it generates barcodes through third-party API.
 *
 * @param placements - Array of placements.
 * @param size - Tuple of numbers. Unit is mm.
 * @param [copies=1] - Amount of copies per product.
 *
 * @example Using predefined label sizes
 * const pdf = await generatePlacementLabels([ ... ], placementLabelSizes['medium'])
 *
 * @example Using custom label sizes
 * const pdf = await generatePlacementLabels([ ... ], [42, 69])
 *
 * @return {jsPDF} - Return a ready-to-print pdf document
 */
export async function generatePlacementLabels(
	placements: PlacementLabel[],
	size: LabelSize,
	copies: number = 1,
): Promise<jsPDF> {
	if (placements.length === 0) {
		throw new Error('Placements array cannot be empty')
	}

	if (copies < 1) {
		throw new Error('Copies must be at least 1')
	}

	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: size,
	})

	doc.setCreationDate(new Date())
	doc.setProperties({
		title: `SkanStock Label - ${size[0]}x${size[1]}mm`,
	})

	const yadom = createYadom()
	const layout = calculateLayout(size)

	const labels: PlacementLabel[] = placements.flatMap(product =>
		Array(copies).fill(product),
	)

	const barcodePromises = labels.map(async placement => {
		const generateRes = await yadom.generateQR({
			data: placement.name,
			imageFormat: ImageFormat.PNG,
			width: 190,
			height: 190,
			quietZone: 10,
		})
		if (!generateRes.success) {
			throw new Error(generateRes.error)
		}
		return generateRes.barcode
	})

	const barcodeResponses = await Promise.all(barcodePromises)

	for (let i = 0; i < labels.length; i++) {
		const placement = labels[i]
		const barcode = barcodeResponses[i]

		if (i > 0) {
			doc.addPage(size, 'landscape')
		}

		const [width, height] = size
		const { fonts, paddingY, paddingX, barcodeSize, spacing } = layout

		const centerX = width / 2
		const centerY = height / 2

		const barcodeX = centerX - barcodeSize / 2
		const barcodeY = centerY - barcodeSize / 2

		doc.setFont('helvetica', 'bold')
		doc.setFontSize(fonts.name)
		doc.setTextColor(0, 0, 0)

		const maxTextWidth = width - paddingX * 2
		const nameLines = doc
			.splitTextToSize(truncate(placement.name, 50), maxTextWidth)
			.slice(0, 1)

		const nameY = barcodeY - spacing
		doc.text(nameLines, centerX, nameY, {
			baseline: 'bottom',
			align: 'center',
			maxWidth: maxTextWidth,
		})

		const barcodeBytes = await barcode.bytes()
		doc.addImage(
			barcodeBytes,
			barcode.imageFormat().toUpperCase(),
			barcodeX,
			barcodeY,
			barcodeSize,
			barcodeSize,
		)

		doc.setFont('helvetica', 'normal')
		doc.setFontSize(fonts.barcodeText)
		doc.setTextColor(0, 0, 0)

		const encodedTextY = barcodeY + barcodeSize + spacing
		doc.text(placement.name, centerX, encodedTextY, {
			baseline: 'top',
			align: 'center',
		})
	}

	return doc
}
