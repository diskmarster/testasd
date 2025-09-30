"use client"

import { formatDuration, formatRelative, intervalToDuration } from "date-fns"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
import { Icons } from "../ui/icons"
import { getDateFnsLocale } from "@/lib/utils"
import { I18NLanguage } from "@/app/i18n/settings"
import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"

export function DurationHoverCard({
	lastDate,
	incomingAt,
	outgoingAt,
	regulatedAt,
	lng
}: {
	lastDate: Date | null
	incomingAt: Date | null
	outgoingAt: Date | null
	regulatedAt: Date | null
	lng: I18NLanguage
}) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, "oversigt")
	const today = new Date()

	function durationToString(date: Date | number | string): string {
		const durationSince = intervalToDuration({
			start: date,
			end: today
		})

		const isDays = (durationSince.days || 0) > 0

		const daysSince = formatDuration(durationSince, {
			locale: getDateFnsLocale(lng),
			zero: false,
			format: ['days']
		})

		const relateSince = formatRelative(date, today, {
			locale: getDateFnsLocale(lng),
		})

		return isDays ? daysSince : relateSince
	}

	if (!lastDate) return null

	return (
		<HoverCard openDelay={250}>
			<HoverCardTrigger className="hover:dark:bg-foreground/20 hover:bg-foreground/10 text-xs font-medium transition-colors duration-200 px-2 py-1 rounded-md">
				{durationToString(lastDate)}
			</HoverCardTrigger>
			<HoverCardContent className="space-y-2 max-w-72">
				<p className="text-xs text-muted-foreground">{t("lastRegistrationHoverText")}</p>

				<ol className="space-y-0.5 text-sm">
					<li className="flex items-center gap-1">
						<Icons.arrowUp className="size-4 text-success" />
						<div className="w-full flex gap-2 items-center justify-between">
							<span>{t("incoming")}</span>
							{incomingAt ? (
								<span>{durationToString(incomingAt)}</span>
							) : (
								<span className="text-muted-foreground">{t("noReg")}</span>
							)}
						</div>
					</li>

					<li className="flex items-center gap-1">
						<Icons.arrowDown className="size-4 text-destructive" />
						<div className="w-full flex gap-2 items-center justify-between">
							<span>{t("outgoing")}</span>
							{outgoingAt ? (
								<span>{durationToString(outgoingAt)}</span>
							) : (
								<span className="text-muted-foreground">{t("noReg")}</span>
							)}
						</div>
					</li>
					<li className="flex items-center gap-1">
						<Icons.arrowDownUp className="size-4 text-warning" />
						<div className="w-full flex gap-2 items-center justify-between">
							<span>{t("regulation")}</span>
							{regulatedAt ? (
								<span>{durationToString(regulatedAt)}</span>
							) : (
								<span className="text-muted-foreground">{t("noReg")}</span>
							)}
						</div>
					</li>
				</ol>
			</HoverCardContent>
		</HoverCard>
	)
}
