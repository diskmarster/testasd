'use client'

import { RefObject } from 'react'
import { Button } from '../ui/button'

interface Props {
	labelRef: RefObject<HTMLDivElement>
}

export function ButtonOpenPrint({ labelRef }: Props) {
	function openPrintWindow() {
		const content = labelRef.current?.outerHTML

		const newWindow = window.open('', '', 'width=800,height=600')

		if (newWindow) {
			const styles = document.querySelector('link[rel="stylesheet"]')?.outerHTML

			newWindow.document.write(`
      <html>
        <head>
          <title>Label Print</title>
          ${styles}
        </head>
        <body>
          ${content}
        </body>
      </html>
`)

			newWindow.document.close()
			newWindow.focus()
			newWindow.onload = e => {
				newWindow.print()
				newWindow.close()
			}
		}
	}

	return (
		<Button className='w-full' variant='outline' onClick={openPrintWindow}>
			Print
		</Button>
	)
}
