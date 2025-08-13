import { User } from 'lucia'
import * as XLSX from 'xlsx'
import { Customer } from '../database/schema/customer'
import { formatDate } from '../utils'

export type ExcelRow = {
	supplierName: string
	sku: string
	barcode: string
	text1: string
	text2: string
	unitName: string
	costPrice: number
	quantity: number
	sum: number
}

export function genReorderExcelWorkbook(
	orderID: string,
	inserted: Date,
	user: User,
	customer: Customer,
	orderLines: ExcelRow[],
	t: (key: string, opts?: any) => string,
	supplier?: {
		name: string
		phone: string | null
		email: string | null
		contact: string | null
		idOfClient: string | null
	},
) {
	const headers = [
		t('report.headers.supplier'),
		t('report.headers.sku'),
		t('report.headers.barcode'),
		t('report.headers.text1'),
		t('report.headers.text2'),
		t('report.headers.unit'),
		t('report.headers.costPrice'),
		t('report.headers.quantity'),
		t('report.headers.sum'),
	]
	const rows = orderLines.map(row => [
		row.supplierName,
		row.sku,
		row.barcode,
		row.text1,
		row.text2,
		row.unitName,
		row.costPrice,
		row.quantity,
		row.sum,
	])

	const emptyRow = [[]]
	const meta = [
		['Bestillingsnr:', orderID],
		['Dato:', formatDate(inserted)],
	]

	let supplierRows = supplier
		? [
				[],
				['Leverandør:', supplier.name],
				['Tlf.:', supplier.phone],
				['Email:', supplier.email],
				['Deres ref:', supplier.contact],
			]
		: []

	const sender = [
		supplier ? ['Afsender:', customer.company] : [],
		supplier ? ['Vores ref:', user.name] : [],
		supplier ? ['Kundenr:', supplier?.idOfClient] : [],
		supplier ? emptyRow : [],
	]

	const workbook = XLSX.utils.book_new()
	const worksheet = XLSX.utils.aoa_to_sheet([
		...meta,
		...supplierRows,
		emptyRow,
		...sender.filter(t => t.length > 0),
		headers,
		...rows,
	])
	XLSX.utils.book_append_sheet(workbook, worksheet, t('report.sheet'), true)
	return workbook
}
