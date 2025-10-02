import { BarcodeRequest } from './types'

class BarcodeGenerator {
	private baseUrl = 'https://barcodes.yadom.io/v1'

	constructor() {}

	async generateQR(req: BarcodeRequest) {
		try {
			const response = await fetch(`${this.baseUrl}/barcodes/qr`, {
				method: 'POST',
				body: JSON.stringify(req),
			})

			if (!response.ok) {
				return
			}

			if (this.isContentType(response, 'application/json')) {
				return
			}

			if (
				this.isContentType(response, 'image/png') ||
				this.isContentType(response, 'image/jpeg')
			) {
				let blob = new Blob()

				try {
					blob = await response.blob()
				} catch (err) {
					return
				}

				return blob
			}

			return
		} catch (err) {
			return
		}
	}

	async generateDatamatrix(req: BarcodeRequest) {
		try {
			const response = await fetch(`${this.baseUrl}/barcodes/datamatrix`, {
				method: 'POST',
				body: JSON.stringify(req),
			})

			if (!response.ok) {
				return
			}

			if (this.isContentType(response, 'application/json')) {
				return
			}

			if (
				this.isContentType(response, 'image/png') ||
				this.isContentType(response, 'image/jpeg')
			) {
				let blob = new Blob()

				try {
					blob = await response.blob()
				} catch (err) {
					return
				}

				return blob
			}

			return
		} catch (err) {
			return
		}
	}

	private isContentType(res: Response, mediaType: string): boolean {
		const contentType = res.headers.get('Content-Type')?.split(';')[0]
		return contentType === mediaType
	}
}

export function createYadom() {
	return new BarcodeGenerator()
}
