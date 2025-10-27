'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { Result } from '@zxing/library'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
interface Props {
	onDetected: (code: string) => void
}

export function SmartphoneScanner({ onDetected }: Props) {
	const videoRef = useRef(null)
	const scannerControls = useRef<IScannerControls | null>(null)
	const lastScanTime = useRef(0)

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')

	useEffect(() => {
		const codeReader = new BrowserMultiFormatReader()
		const videoElement = videoRef.current

		const startScanner = async () => {
			try {
				const devices = await BrowserMultiFormatReader.listVideoInputDevices()
				if (devices.length === 0) {
					toast(t('noCameraDevices'))
					return
				}

				scannerControls.current = await codeReader.decodeFromVideoDevice(
					undefined,
					videoRef.current!,
					(result?: Result) => {
						const now = Date.now()
						if (result && now - lastScanTime.current > 750) {
							lastScanTime.current = now
							onDetected(result.getText())
						}
					},
				)
			} catch (err) {
				toast(t('scannerUnknownErr'))
			}
		}

		startScanner()

		return () => {
			if (scannerControls.current) {
				scannerControls.current.stop()
			}
			// @ts-ignore
			if (videoElement && videoElement.srcObject) {
				// @ts-ignore
				const stream = videoElement.srcObject as MediaStream
				stream.getTracks().forEach(track => track.stop())
				// @ts-ignore
				videoElement.srcObject = null
			}
		}
	}, [])

	return <video ref={videoRef} className='w-full h-auto scale-150' />
}
