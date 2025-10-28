import jsPDF from 'jspdf'
import { maxLines } from '../utils'
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
			text1: Math.max(10, Math.min(20, 12 * scale)),
			text2: Math.max(8, Math.min(11, 8 * scale)),
			sku: Math.max(8, Math.min(11, 8 * scale)),
			barcodeText: Math.max(7, Math.min(10, 7 * scale)),
		},
		paddingY: Math.max(0.5, 2.5 * scale),
		paddingX: Math.max(2.5, 2.5 * scale),
		barcodeScale: 0.7,
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

	const barcodePromises = labels.map(async product => {
		const generateRes = await yadom.generateQR({
			data: product.barcode,
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
		const product = labels[i]
		const barcode = barcodeResponses[i]

		if (i > 0) {
			doc.addPage(size, 'landscape')
		}

		const [width, height] = size
		const { fonts, paddingY, paddingX, barcodeScale } = layout

		const textWidth = width - paddingX * 3.5

		// doc.setLineWidth(lineWidth)
		// doc.setDrawColor(210, 210, 210)
		// doc.line(barcodeX - paddingX * 0.75, 0, barcodeX - paddingX * 0.75, height)

		doc.setFont('helvetica', 'bold')
		doc.setFontSize(fonts.text1)
		doc.setTextColor(20, 20, 20)

		const text1Lines = maxLines(
			doc.splitTextToSize(product.text1, textWidth) as string[],
			2,
		)

		const text1Dim = text1Lines.reduce(
			(acc, cur) => {
				const curDim = doc.getTextDimensions(cur, {
					fontSize: fonts.text1,
				})
				return {
					h: acc.h + curDim.h,
					w: Math.max(acc.w, curDim.w),
				}
			},
			{ h: 0, w: 0 },
		)
		doc.text(text1Lines, paddingX, paddingY, {
			baseline: 'top',
			lineHeightFactor: 1,
			maxWidth: textWidth,
		})

		let currentY = paddingY + text1Dim.h + paddingY

		const remainingHeight = height - currentY

		const barcodeTextDim = doc.getTextDimensions(product.barcode, {
			fontSize: fonts.barcodeText,
		})

		const barcodeImageBottom = height - paddingY * 2 - 0.5

		const barcodeSize = remainingHeight * barcodeScale
		const barcodePaddingTop =
			barcodeImageBottom - (currentY + barcodeSize + barcodeTextDim.h)

		const barcodeX = width - barcodeSize - paddingX * 1.5
		const barcodeY = currentY + barcodePaddingTop

		if (product.text2) {
			doc.setFont('helvetica', 'normal')
			doc.setFontSize(fonts.text2)
			doc.setTextColor(0, 0, 0)
			const text2Width = width - (paddingX + barcodeSize + paddingX)

			const text2Lines = maxLines(
				doc.splitTextToSize(product.text2, text2Width),
				2,
			)
			doc.text(text2Lines, paddingX, currentY, {
				baseline: 'top',
				lineHeightFactor: 1.1,
				maxWidth: text2Width,
			})
		}

		const skuY = height - paddingY * 2

		doc.setFont('helvetica', 'normal')
		doc.setFontSize(fonts.sku)
		doc.setTextColor(0, 0, 0)
		doc.text(`Varenr.: ${product.sku}`, paddingX, skuY, {
			baseline: 'bottom',
			maxWidth: width - barcodeSize,
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

		const barcodeTextFontSize = fonts.barcodeText
		const barcodeTextY = skuY

		doc.setFont('helvetica', 'normal')
		doc.setFontSize(barcodeTextFontSize)
		doc.setTextColor(0, 0, 0)

		const barcodeTextX = barcodeX + barcodeSize / 2
		doc.text(product.barcode, barcodeTextX, barcodeTextY, {
			baseline: 'bottom',
			align: 'center',
		})
	}

	return doc
}
