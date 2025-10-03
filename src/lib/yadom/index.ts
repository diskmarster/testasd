import { Barcode } from './barcode'
import {
	BarcodeAPIResponseError,
	BarcodeRequest,
	BarcodeType,
	GenerateResponse,
	GS1BarcodeRequest,
	ImageFormat,
} from './types'

class BarcodeGenerator {
	private apiKey = '' // implementation tot come
	private baseUrl = 'https://barcodes.yadom.io/v1'

	constructor() {}

	async generateQR(req: BarcodeRequest): Promise<GenerateResponse> {
		const [barcode, error] = await this.fetchBarcode(
			`${this.baseUrl}/barcodes/qr`,
			BarcodeType.QR,
			req,
		)
		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}
		return {
			success: true,
			barcode: barcode,
		}
	}

	async generateDatamatrix(req: BarcodeRequest): Promise<GenerateResponse> {
		const [barcode, error] = await this.fetchBarcode(
			`${this.baseUrl}/barcodes/datamatrix`,
			BarcodeType.Datamatrix,
			req,
		)
		if (error) {
			return {
				success: false,
				error: error.message,
			}
		}
		return {
			success: true,
			barcode: barcode,
		}
	}

	private async fetchBarcode(
		url: string,
		type: BarcodeType,
		req: BarcodeRequest | GS1BarcodeRequest,
	): Promise<[Barcode, null] | [null, Error]> {
		if (!req.imageFormat) {
			req.imageFormat = ImageFormat.PNG
		}
		try {
			const response = await fetch(url, {
				method: 'POST',
				body: JSON.stringify(req),
				headers: {
					'X-API-Key': this.apiKey,
				},
			})
			if (!response.ok) {
				let messege = 'Unknown error occured'
				if (this.isContentType(response, 'application/json')) {
					let json
					try {
						json = (await response.json()) as BarcodeAPIResponseError
					} catch (err) {
						return [null, err as Error]
					}
					messege = json.error
				}
				if (this.isContentType(response, 'text/plain')) {
					let text
					try {
						text = await response.text()
					} catch (err) {
						return [null, err as Error]
					}
					messege = text
				}
				return [null, new Error(messege)]
			}
			let blob
			try {
				blob = await response.blob()
			} catch (err) {
				return [null, err as Error]
			}
			const barcode = new Barcode(blob, type, req.imageFormat)
			return [barcode, null]
		} catch (err) {
			return [null, err as Error]
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
