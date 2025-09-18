import { redirect, RedirectType } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(r: NextRequest, ctx: { params: { lng: string } }) {
	redirect(
		`/${ctx.params.lng}/administration/firma/indstillinger`,
		RedirectType.replace,
	)
}
