import jsPDF from 'jspdf'
import { createYadom } from '../yadom'
import { ImageFormat } from '../yadom/types'

export type ProductLabel = {
	text1: string
	text2?: string
	sku: string
	barcode: string
}

type LabelSize = [number, number]

export const productLabelSizes: Record<string, LabelSize> = {
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
			text1: Math.max(8, Math.min(20, 12 * scale)),
			text2: Math.max(6, Math.min(11, 8 * scale)),
			sku: Math.max(6, Math.min(11, 8 * scale)),
		},
		paddingY: Math.max(0.5, 2.5 * scale),
		paddingX: Math.max(2, 2.5 * scale),
		lineWidth: Math.max(0.15, 0.2 * scale),
		barcodeSize: Math.min(height * 0.65, width * 0.35),
	}
}

/**
 * Generates a ready-to-print PDF document for the provided products.
 * Function is async because it generates barcodes through third-party API.
 *
 * @param products - Array of products.
 * @param size - Tuple of numbers. Unit is mm.
 * @param [copies=1] - Amount of copies per product.
 *
 * @example Using predefined label sizes
 * const pdf = await generateProductLabels([ ... ], productLabelSizes['medium'])
 *
 * @example Using custom label sizes
 * const pdf = await generateProductLabels([ ... ], [42, 69])
 *
 * @return {jsPDF} - Return a ready-to-print pdf document
 */
export async function generateProductLabels(
	products: ProductLabel[],
	size: LabelSize,
	copies: number = 1,
): Promise<jsPDF> {
	if (products.length === 0) {
		throw new Error('Products array cannot be empty')
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

	const labels: ProductLabel[] = products.flatMap(product =>
		Array(copies).fill(product),
	)

	const barcodePromises = labels.map(product =>
		yadom.generateDatamatrix({
			data: product.barcode,
			imageFormat: ImageFormat.PNG,
			width: 190,
			height: 190,
			quietZone: 10,
		}),
	)

	const barcodeBlobs = await Promise.all(barcodePromises)

	const barcodeArrays = await Promise.all(
		barcodeBlobs.map(async blob => {
			if (!blob) {
				throw new Error('Barcode generation failed')
			}
			return new Uint8Array(await blob.arrayBuffer())
		}),
	)

	for (let i = 0; i < labels.length; i++) {
		const product = labels[i]
		const barcodeArray = barcodeArrays[i]

		if (i > 0) {
			doc.addPage(size, 'landscape')
		}

		const [width, height] = size
		const { fonts, paddingY, paddingX, lineWidth, barcodeSize } = layout

		const textWidth = width - barcodeSize - paddingX * 3.5

		const barcodeX = width - barcodeSize - paddingX
		const barcodeY = (height - barcodeSize) / 2

		doc.setLineWidth(lineWidth)
		doc.setDrawColor(226, 231, 240)
		doc.line(barcodeX - paddingX * 0.75, 0, barcodeX - paddingX * 0.75, height)
		const dividerX = barcodeX - paddingX * 0.75
		doc.line(dividerX, 0, dividerX, height)
		doc.setFillColor(241, 245, 249)
		doc.rect(dividerX, 0, width - dividerX, height, 'F')

		doc.setFont('helvetica', 'bold')
		doc.setFontSize(fonts.text1)
		doc.setTextColor(20, 20, 20)

		const text1Lines = doc.splitTextToSize(product.text1, textWidth)
		const text1Height = doc.getTextDimensions(text1Lines, {
			fontSize: fonts.text1,
		})
		doc.text(text1Lines, paddingX, paddingY, {
			baseline: 'top',
			lineHeightFactor: 1,
			maxWidth: textWidth,
		})

		let currentY = paddingY + text1Height['h'] + paddingY

		if (product.text2) {
			doc.setFont('helvetica', 'normal')
			doc.setFontSize(fonts.text2)
			doc.setTextColor(100, 100, 100)

			const text2Lines = doc.splitTextToSize(product.text2, textWidth)
			doc.text(text2Lines, paddingX, currentY, {
				baseline: 'top',
				lineHeightFactor: 1.1,
				maxWidth: textWidth,
			})
		}

		const skuY = height - paddingY - fonts.sku * 0.5

		doc.setFont('helvetica', 'normal')
		doc.setFontSize(fonts.sku)
		doc.setTextColor(100, 100, 100)
		doc.text(`Varenr.: ${product.sku}`, paddingX, skuY, {
			baseline: 'middle',
		})

		doc.addImage(
			barcodeArray,
			'PNG',
			barcodeX,
			barcodeY,
			barcodeSize,
			barcodeSize,
		)
	}

	return doc
}
