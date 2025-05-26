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

function AnswerCronMails() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.cron-mails.sub')}</p>
			<div className='flex flex-col gap-1'>
				<p className='font-medium'>{t('faq-page.cron-mails.answer-title')}</p>
				<p>{t('faq-page.cron-mails.answer')}</p>
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

function AnswerImportInventory() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.to-import')}</p>
			<p>{t('faq-page.table-data')}</p>
			<ol className='space-y-2'>
				<li>
					<span className='font-semibold'>{t('faq-page.product-no')} </span>
					<span className=''>{t('faq-page.product-no-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.barcode')} </span>
					<span className=''>{t('faq-page.barcode-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.product-group')} </span>
					<span className=''>{t('faq-page.product-group-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.unit')} </span>
					<span>{t('faq-page.unit-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.text1')} </span>
					<span className=''>{t('faq-page.text1-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.text2')} </span>
					<span className=''>{t('faq-page.text2-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.text3')} </span>
					<span className=''>{t('faq-page.text3-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.cost-price')} </span>
					<span>{t('faq-page.cost-price-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.sales-price')} </span>
					<span>{t('faq-page.sales-price-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.barred')} </span>
					<span>{t('faq-page.barred-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.minimum')} </span>
					<span>{t('faq-page.minimum-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.maximum')} </span>
					<span>{t('faq-page.maximum-criteria')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.order-amount')} </span>
					<span>{t('faq-page.order-amount-criteria')}</span>
				</li>
			</ol>
		</div>
	)
}

function AnswerUserRoles() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')

	return (
		<div className='flex flex-col gap-4'>
			<p>{t('faq-page.user-roles-description')}</p>
			<ol className='space-y-2'>
				<li>
					<span className='font-semibold'>{t('faq-page.role-admin')}</span>
					<span className=''>{t('faq-page.role-admin-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-moderator')}</span>
					<span className=''>{t('faq-page.role-moderator-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-user')}</span>
					<span className=''>{t('faq-page.role-user-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-departure')}</span>
					<span className=''>{t('faq-page.role-departure-description')}</span>
				</li>
				<li>
					<span className='font-semibold'>{t('faq-page.role-readonly')}</span>
					<span className=''>{t('faq-page.role-readonly-description')}</span>
				</li>
			</ol>
		</div>
	)
}
