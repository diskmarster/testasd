'use client'

import { useTranslation } from '@/app/i18n/client'
import { SiteWrapper } from '@/components/common/site-wrapper'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { useSearchParams } from 'next/navigation'
import { forwardRef, useEffect, useRef, useState } from 'react'

export default function Page() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')
	const searchParams = useSearchParams()
	const questionParam = searchParams.get('spørgsmål')

	const [accordionValue, setAccordionValue] = useState<string>()

	const questionRefs = useRef<Array<HTMLDivElement | null>>([])

	const questions: { question: string; answer: string | React.ReactNode }[] = [
		{
			question: t('faq-page.question-user-roles'),
			answer: <AnswerUserRoles />,
		},
		{
			question: t('faq-page.question-format-import'),
			answer: <AnswerImportInventory />,
		},
		{
			question: t('faq-page.cron-mails.question'),
			answer: <AnswerCronMails />,
		},
		{
			question: t('faq-page.app-signout.question'),
			answer: <AnswerAppSignout />,
		},
		{
			question: t('faq-page.restock-setup.question'),
			answer: <AnswerRestockSetup />,
		},
		{
			question: t('faq-page.delete-sku.question'),
			answer: <AnswerDeleteSku />,
		},
		{
			question: t('faq-page.suppliers.question'),
			answer: <AnswerSuppliers />,
		},
		{
			question: t('faq-page.locations-vs-placements.question'),
			answer: <AnswerLocationVsPlacement />
		},
	]

	const questionIndex = questions.findIndex(q => q.question == questionParam)

	useEffect(() => {
		if (questionParam) {
			if (questionRefs.current[questionIndex]) {
				setAccordionValue(`q-${questionIndex}`)
				questionRefs.current[questionIndex]?.scrollIntoView({
					behavior: 'smooth',
					block: 'end',
					inline: 'end',
				})
			} else {
				console.warn('no ref at index')
			}
		}
	}, [questionParam, questionIndex])

	return (
		<SiteWrapper
			title={t('faq-page.title')}
			description={t('faq-page.description')}>
			<div className='lg:w-1/2 max-w-[70ch]'>
				<Accordion
					type='single'
					value={accordionValue}
					onValueChange={value => setAccordionValue(value)}
					collapsible
					className='space-y-4'>
					{questions.map((q, i) => (
						<QandA
							key={i}
							// @ts-ignore
							ref={el => (questionRefs.current[i] = el)}
							question={q.question}
							answer={q.answer}
							index={i}
						/>
					))}
				</Accordion>
			</div>
		</SiteWrapper>
	)
}

const QandA = forwardRef<
	HTMLDivElement,
	{ question: string; answer: string | React.ReactNode; index: number }
>(function QandA({ question, answer, index }, ref) {
	return (
		<AccordionItem ref={ref} value={`q-${index}`}>
			<AccordionTrigger>{question}</AccordionTrigger>
			<AccordionContent>{answer}</AccordionContent>
		</AccordionItem>
	)
})

type Video = {
	title: string
	type: string
	src: string
}

const VideosAccordion = forwardRef<
	HTMLDivElement,
	{ videos: Video[] }
>(function VideosAccordion({ videos }, ref) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, "other", { keyPrefix: "videos" })
	const { user } = useSession()
	return user ? (
		<Accordion type="multiple">
			<AccordionItem ref={ref} value="item-1-videoes" className='bg-transparent p-0'>
				<AccordionTrigger>
					<p className='font-medium'>{t("title")}</p>
				</AccordionTrigger>
				<AccordionContent>
					<div className='grid gap-4 grid-cols-1 sm:grid-cols-2 [&>*:only-child]:col-span-2'>
						{videos.map((v, i) => (
							<div key={`${i}-${v.title}`} className='flex flex-col gap-1.5'>
								<video className='rounded-md' controls>
									<source src={v.src} type={v.type} />
									{t("not-supported")}
								</video>
								<small className='text-xs font-medium'>{v.title}</small>
							</div>
						))}
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	) : null
})

function AnswerUserRoles() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.user-roles-description')}</p>
			<ol className='space-y-2'>
				<li>
					<span className='font-semibold'>{t('faq-page.role-admin')}</span><br />
					<span className=''>{t('faq-page.role-admin-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-moderator')}</span><br />
					<span className=''>{t('faq-page.role-moderator-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-user')}</span><br />
					<span className=''>{t('faq-page.role-user-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-departure')}</span><br />
					<span className=''>{t('faq-page.role-departure-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-readonly')}</span><br />
					<span className=''>{t('faq-page.role-readonly-description')}</span>
				</li>
			</ol>
		</div>
	)
}

function AnswerImportInventory() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other', { keyPrefix: "faq-page" })

	return (
		<div className='flex flex-col gap-4'>
			<p className='text-base font-semibold'>
				{t("important-information")}
			</p>
			<p>{t("sub1")}</p>
			<p className='font-semibold'>
				{t("sub2")}
			</p>
			<ul className='flex flex-col gap-2 list-outside pl-4'>
				<li className='space-y-px'>
					<li className='ml-4 list-disc'>
						<span className='font-semibold'>{t("sub-list-li-1")}</span>
						<span>{t("sub-list-li-2")}</span>
					</li>
					<li className='ml-4 list-disc'>
						<span className='font-semibold'>{t("sub-list-li-3")}</span>
						<span>{t("sub-list-li-4")}</span>
					</li>
				</li>
			</ul>
			<p>{t("sub3")}</p>

			<ol className='space-y-3'>
				<li>
					<span className='font-semibold'>{t('product-no')}</span><br />
					<span className=''>{t('product-no-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('barcode')}</span><br />
					<span className=''>{t('barcode-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('product-group')} </span><br />
					<span className=''>{t('product-group-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('unit')} </span><br />
					<span>{t('unit-criteria')}</span><br /><br />
					<span>{t('unit-criteria2')}</span><br />
					<span className='text-xs italic'>{t('unit-criteria3')}</span><br />

				</li>
				<li>
					<span className='font-semibold'>{t('text1')} </span><br />
					<span>{t('text1-criteria').split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('text2-3')} </span><br />
					<span className=''>{t('text2-3-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('cost-price')} </span><br />
					<span>{t('cost-price-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('sales-price')} </span><br />
					<span>{t('sales-price-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('barred')} </span><br />
					<span>{t('barred-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('minimum')} </span><br />
					<span>{t('minimum-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('maximum')} </span><br />
					<span>{t('maximum-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('order-amount')} </span><br />
					<span>{t('order-amount-criteria')}</span>
				</li>
			</ol>
		</div>
	)
}

function AnswerCronMails() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.cron-mails.sub')}</p>
			<div className='flex flex-col gap-1'>
				<p className='font-semibold'>{t('faq-page.cron-mails.stock-value-title')}</p>
				<p>{t('faq-page.cron-mails.stock-value-answer')}</p>
			</div>
			<div className='flex flex-col gap-1'>
				<p className='font-semibold'>{t('faq-page.cron-mails.restock-title')}</p>
				<p>{t('faq-page.cron-mails.restock-answer')}</p>
			</div>
			<div className='flex flex-col gap-1'>
				<p className='font-semibold'>{t('faq-page.cron-mails.movements-title')}</p>
				<p>{t('faq-page.cron-mails.movements-answer')}</p>
			</div>
		</div>
	)
}

function AnswerAppSignout() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.app-signout.sub')}</p>
			<ul className='flex flex-col gap-2 list-outside pl-4'>
				<li className='space-y-px'>
					<li className='font-medium list-disc'>
						{t('faq-page.app-signout.li-name', { context: 'screen' })}
					</li>
					<li className='ml-4'>
						{t('faq-page.app-signout.li-desc', { context: 'screen' })}
					</li>
				</li>
				<li className='space-y-px'>
					<li className='font-medium list-disc'>
						{t('faq-page.app-signout.li-name', { context: 'background' })}
					</li>
					<li className='ml-4'>
						{t('faq-page.app-signout.li-desc', { context: 'background' })}
					</li>
				</li>
			</ul>
		</div>
	)
}

function AnswerRestockSetup() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	const videos: Video[] = [
		{
			title: "Tilføj minimumsbeholdning",
			type: "video/mp4",
			src: "https://nemlager-videoer-dfg834f.s3.eu-central-1.amazonaws.com/faq/NemLager+-+Tilf%C3%B8j+Minimum+Beholdning.mp4"
		}
	]

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.restock-setup.sub')}</p>
			<p> {t('faq-page.restock-setup.methods')} </p>
			<p className='font-semibold'> {t('faq-page.restock-setup.watch-how')} </p>

			<div className="flex flex-col gap-2">
				{videos.map((video, index) => (
					<div key={index}>
						<p className="font-medium">{video.title}</p>
						<video controls className='rounded shadow max-w-full'>
							<source src={video.src} type={video.type} />
							Din browser understøtter ikke video.
						</video>
					</div>
				))}
			</div>
		</div>
	);
}

function AnswerDeleteSku() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className="flex flex-col gap-4">
			<p>{t('faq-page.delete-sku.sub')}</p>

			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.delete-sku.option1')}</p>
				<p>{t('faq-page.delete-sku.option1-sub')}</p>
			</div>

			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.delete-sku.option2')}</p>
				<p>{t('faq-page.delete-sku.option2-sub')}</p>
			</div>

			<p className="italic">
				<span className='font-semibold'>
					{t('faq-page.delete-sku.tip')}</span><br />
				{t('faq-page.delete-sku.tip-txt')}
			</p>

			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.delete-sku.steps-delete-title')}</p>
				<ol className="list-decimal list-outside pl-5">
					<li>{t('faq-page.delete-sku.steps-delete-1')}</li>
					<li>{t('faq-page.delete-sku.steps-delete-2')}</li>
					<li>{t('faq-page.delete-sku.steps-delete-3')}</li>
					<li>{t('faq-page.delete-sku.steps-delete-4')}</li>
				</ol>
			</div>

			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.delete-sku.steps-block-title')}</p>
				<ol className="list-decimal list-outside pl-5">
					<li>{t('faq-page.delete-sku.steps-block-1')}</li>
					<li>{t('faq-page.delete-sku.steps-block-2')}</li>
					<li>{t('faq-page.delete-sku.steps-block-3')}</li>
					<li>{t('faq-page.delete-sku.steps-block-4')}</li>
				</ol>
			</div>
		</div>
	)
}

function AnswerSuppliers() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.suppliers.sub')}</p>
			<p>{t('faq-page.suppliers.intro')}</p>
			<div className="flex flex-col gap-1">
				<p className='font-semibold'>{t('faq-page.suppliers.benefits-title')}</p>
				<ul className='list-disc list-outside pl-5'>
					<li>{t('faq-page.suppliers.benefit-1')}</li>
					<li>{t('faq-page.suppliers.benefit-2')}</li>
					<li>{t('faq-page.suppliers.benefit-3')}</li>
					<li>{t('faq-page.suppliers.benefit-4')}</li>
				</ul>
			</div>
			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.suppliers.steps-title')}</p>
				<ol className="list-decimal list-outside pl-5">
					<li>{t('faq-page.suppliers.steps-1')}</li>
					<li>{t('faq-page.suppliers.steps-2')}</li>
					<li>{t('faq-page.suppliers.steps-3')}</li>
					<li>{t('faq-page.suppliers.steps-4')}</li>
					<li>{t('faq-page.suppliers.steps-5')}</li>
				</ol>
				<br />
				<p className="italic">
					<span className='font-semibold'>
						{t('faq-page.suppliers.tip')}</span><br />
					{t('faq-page.suppliers.tip-txt')}
				</p>
			</div>
			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.suppliers.steps-link-title')}</p>
				<ol className="list-decimal list-outside pl-5">
					<li>{t('faq-page.suppliers.steps-link-1')}</li>
					<li>{t('faq-page.suppliers.steps-link-2')}</li>
					<li>{t('faq-page.suppliers.steps-link-3')}</li>
					<li>{t('faq-page.suppliers.steps-link-4')}</li>
					<li>{t('faq-page.suppliers.steps-link-5')}</li>
				</ol>
			</div>
		</div>
	)
}

function AnswerLocationVsPlacement() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className="flex flex-col gap-4">
			<p>{t('faq-page.locations-vs-placements.sub')}</p>
			<p><span className='font-semibold'>{t('faq-page.locations-vs-placements.location-title')}</span> {t('faq-page.locations-vs-placements.location')}</p>
			<p><span className='font-semibold'>{t('faq-page.locations-vs-placements.placement-title')}</span> {t('faq-page.locations-vs-placements.placement')}</p>

			<div className="flex flex-col gap-1">
				<p className="font-semibold">{t('faq-page.locations-vs-placements.roles-title')}</p>
				<p><span className='font-semibold'>{t('faq-page.locations-vs-placements.role-admin')}</span> {t('faq-page.locations-vs-placements.role-admin-txt')}</p>
				<p><span className='font-semibold'>{t('faq-page.locations-vs-placements.role-moderator')}</span> {t('faq-page.locations-vs-placements.role-moderator-txt')}</p>
				<p><span className='font-semibold'>{t('faq-page.locations-vs-placements.role-other')}</span> {t('faq-page.locations-vs-placements.role-other-txt')}</p>
			</div>

		</div>
	)
}
