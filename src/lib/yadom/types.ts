export enum BarcodeType {
	QR = 'qr',
	Code128 = 'code128',
	Datamatrix = 'datamatrix',
	GS1Datamatrix = 'gs1-datamatrix',
}

export enum ImageFormat {
	PNG = 'png',
	JPEG = 'jpeg',
}

export type BarcodeRequest = {
	data: string
	width: number
	height: number
	imageFormat?: ImageFormat
	quietZone?: number
}

type AI = {
	ai: string
	value: string
}

export type GS1BarcodeRequest = {
	ais: AI[]
	width: number
	height: number
	imageFormat?: ImageFormat
	quietZone?: number
}
