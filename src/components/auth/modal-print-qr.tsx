'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { ButtonOpenPrint } from '../inventory/button-open-print'
import {
	Credenza,
	CredenzaBody,
	CredenzaContent,
	CredenzaDescription,
	CredenzaHeader,
	CredenzaTitle,
} from '../ui/credenza'
import { Label } from '../ui/label'
import { PasswordInput } from '../ui/password-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

interface Props {}

type LabelSize = 'small' | 'medium' | 'large'

export function ModalQrPrint({}: Props) {
	const [open, setOpen] = useState(false)
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')
	const sizes = ['small', 'medium', 'big']
	const [size, setSize] = useState<LabelSize>(
		(localStorage?.getItem('label-size') as LabelSize) ?? 'small',
	)
	const [userName, setUserName] = useState<string>('')
	const [userEmail, setUserEmail] = useState<string>('')
	const [pinCode, setPinCode] = useState<string>('')
	const [pinEntered, setPinEntered] = useState(false)

	function handleOpenChange(open: boolean) {
		setSize((localStorage?.getItem('label-size') as LabelSize) ?? 'small')
		setOpen(open)
	}

	useCustomEventListener('PrintQrForUser', (data: any) => {
		setOpen(true)
		setUserName(data.userName)
		setUserEmail(data.userEmail)
		setPinEntered(false)
		setPinCode('')
	})

	return (
		<Credenza open={open} onOpenChange={handleOpenChange}>
			<CredenzaContent className='min-w-96 max-w-fit'>
				<CredenzaHeader>
					<CredenzaTitle>{t('modal-show-user-label.title')}</CredenzaTitle>
					<CredenzaDescription>
						{t('modal-show-user-label.description', { username: userName })}
					</CredenzaDescription>
				</CredenzaHeader>
				<CredenzaBody className='space-y-4 pb-4 md:pb-1'>
					<div className='grid gap-1.5'>
						<Label>PIN</Label>
						<PasswordInput
							onChange={e => {
								if (e.target.value.length > 4) {
									return
								}

								setPinCode(e.target.value)
								setPinEntered(e.target.value.length == 4)
							}}
							value={pinCode}
						/>
					</div>
					{pinEntered && (
						<ShowFinalUserLabel
							sizes={sizes}
							t={t}
							qrValue={`${userEmail};${pinCode}`}
							size={size}
							setSize={setSize}
							title={userName}
						/>
					)}
				</CredenzaBody>
			</CredenzaContent>
		</Credenza>
	)
}

interface FinalLabelProps {
	sizes: string[]
	t: (translate: string, extra?: any) => string
	qrValue: string
	size: string
	setSize: (value: LabelSize) => void
	title: string
}

function ShowFinalUserLabel({
	sizes,
	t,
	qrValue,
	size,
	setSize,
	title,
}: FinalLabelProps) {
	const ref = useRef<HTMLDivElement>(null)
	return (
		<>
			<div className='grid gap-2'>
				<Label htmlFor='size'>{t('modal-show-user-label.size')}</Label>
				<Select
					value={size}
					onValueChange={(value: LabelSize) => {
						localStorage?.setItem('label-size', value)
						setSize(value)
					}}>
					<SelectTrigger>
						<SelectValue placeholder={t('modal-show-user-label.size')} />
					</SelectTrigger>
					<SelectContent>
						{sizes.map((size, index) => (
							<SelectItem key={index} value={size} className='cursor-pointer'>
								<div className='flex gap-1 items-center'>
									<span className='capitalize'>
										{t('modal-show-user-label.size', { context: size })}
									</span>
									<span className='text-muted-foreground'>
										-{' '}
										{t('modal-show-user-label.size-desc', {
											context: size,
										})}
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className='border rounded-md'>
				{size == 'small' ? (
					<div ref={ref} className={cn('prin:w-[51mm] print:h-[21mm]')}>
						<div className='p-1.5 space-y-1 print:p-2 print:space-y-2'>
							<div className='flex items-center justify-center'>
								<p className='font-bold truncate max-w-56 print:text-base'>
									{title}
								</p>
							</div>
							<div className='flex flex-col items-center'>
								<QRCodeSVG value={qrValue} className='print:size-8 size-14' />
							</div>
						</div>
					</div>
				) : size == 'medium' ? (
					<div
						ref={ref}
						className={cn(
							'print:w-auto print:h-auto print:border-none print:rounded-none',
							'w-[332px] h-[51mm]',
						)}>
						<div className='p-2 print:p-2 flex flex-col justify-between items-center h-full'>
							<div className='flex flex-col gap-1'>
								<p className='font-bold text-2xl print:leading-normal truncate print:text-xl'>
									{title}
								</p>
							</div>
							<div className='flex flex-col items-center gap-0.5'>
								<div className='flex flex-col items-center gap-0.5'>
									<QRCodeSVG
										value={qrValue}
										className='print:size-28 size-24'
									/>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div
						ref={ref}
						className={cn(
							'print:w-auto print:h-auto print:border-none print:rounded-none',
							'w-[15cm] h-[8cm]',
						)}>
						<div className='p-6 print:p-10 flex flex-col justify-between items-center h-full'>
							<div className='flex flex-col gap-1'>
								<p className='font-bold text-3xl print:leading-normal truncate print:text-5xl'>
									{title}
								</p>
							</div>
							<div className='flex items-end justify-center'>
								<div className='flex flex-col items-center gap-0.5'>
									<QRCodeSVG
										value={qrValue}
										className='print:size-40 size-36'
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
			<ButtonOpenPrint labelRef={ref} />
		</>
	)
}
