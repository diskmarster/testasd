import { BarcodeType, ImageFormat } from './types'

export class Barcode {
	private barcodeBlob: Blob
	private barcodeType: BarcodeType
	private barcodeImageFormat: ImageFormat

	constructor(blob: Blob, type: BarcodeType, imageFormat: ImageFormat) {
		this.barcodeBlob = blob
		this.barcodeType = type
		this.barcodeImageFormat = imageFormat
	}

	imageFormat(): ImageFormat {
		return this.barcodeImageFormat
	}

	type(): BarcodeType {
		return this.barcodeType
	}

	blob(): Blob {
		return this.barcodeBlob
	}

	async bytes(): Promise<Uint8Array> {
		return new Uint8Array(await this.barcodeBlob.arrayBuffer())
	}

	async base64(): Promise<string> {
		const text = await this.barcodeBlob.text()
		const buffer = Buffer.from(text, 'base64')
		return buffer.toString('base64')
	}
}
