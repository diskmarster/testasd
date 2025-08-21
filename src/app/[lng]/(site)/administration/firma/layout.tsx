import { serverTranslation } from "@/app/i18n";
import { SiteWrapper } from "@/components/common/site-wrapper";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
	params: {
		lng: string
	}
}

export default async function AdminLayout({ children, params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')
	const pathname = headers().get('x-current-path')
	return (
		<SiteWrapper
			title={t('company-page.title')}
			description={t('company-page.description')}>
			<div className="lg:grid lg:grid-cols-[200px_1fr] max-lg:space-y-4 lg:space-x-4 grow">
				<Sidebar pathname={pathname} lng={lng} />
				<div>
					{children}
				</div>
			</div>
		</SiteWrapper>
	)
}

async function Sidebar({ pathname, lng }: { pathname: string | null, lng: string }) {
	const { t } = await serverTranslation(lng, 'organisation')
	function isActive(path: string): boolean {
		return pathname ? pathname.includes(path) : false
	}

	function toPath(path: string): string {
		return `/${lng}/administration/firma` + path
	}

	const subpages = [
		{ path: toPath('/indstillinger'), label: t('sidebar.settings') },
		{ path: toPath('/mails'), label: t('sidebar.mails') },
		{ path: toPath('/integrationer'), label: t('sidebar.integrations') }
	]

	return (
		<aside className="pb-4 border-b lg:border-b-0 lg:border-r lg:pr-4 lg:pb-0 lg:pt-2">
			<ul className="flex items-center gap-1 lg:flex-col lg:items-start w-fit lg:w-full">
				{subpages.map(page => (
					<li key={page.label} className="w-full">
						<a
							href={page.path}
							className={cn(
								'text-sm text-muted-foreground px-2 py-1.5 rounded-md font-medium w-full block transition-colors',
								'hover:bg-muted/80',
								isActive(page.path) && 'bg-muted text-foreground')}
						>
							{page.label}
						</a>
					</li>
				))}
			</ul>
		</aside>
	)
}
