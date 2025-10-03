import { Barcode } from './barcode'

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

export type BarcodeAPIResponseError = {
	error: string
}

type Success = {
	success: true
	error?: never
	barcode: Barcode
}

type Failed = {
	success: false
	error: string
	barcode?: never
}

export type GenerateResponse = Success | Failed
