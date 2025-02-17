"use client"

import { SiteWrapper } from "@/components/common/site-wrapper"
import { useSession } from "@/context/session"
import { allowedMimetypes, AttachmentType, fileService } from "@/service/file"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { createAttachmentAction, deleteAttachmentAction, uploadFileAction } from "./actions"
import { File } from "lucide-react"
import Link from "next/link"

export default function Page() {
	const { user } = useSession()
	const [errors, setErrors] = useState<string[]>([])
	const [items, setItems] = useState<{ url: string, type: AttachmentType }[]>([])

	const onDrop = useCallback(async (files: File[]) => {
		for (const file of files) {
			console.log("starting upload of ", file.name)
			const arrayBuffer = await file.arrayBuffer()
			const buffer = new Uint8Array(arrayBuffer)
			let binary = ""

			// @ts-ignore
			if (Uint8Array.prototype.toBase64) {
				// @ts-ignore
				binary = buffer.toBase64('base64url')
			} else {
				for (let i = 0; i < buffer.length; i++) {
					binary += String.fromCharCode(buffer[i])
				}
			}

			const base64 = btoa(binary)

			const isValidated = fileService.validate(file, {
				customerID: user?.customerID!,
				mimeType: file.type,
				refType: 'product',
				refID: 345
			})
			if (!isValidated.success) {
				console.error(isValidated.error)
				continue
			}

			console.log({ file: file.size, b64: binary.length })
			console.table({ key: isValidated.key, url: isValidated.url })

			const uploadPromise = uploadFileAction({ key: isValidated.key, type: file.type, body: base64 })
			const attachmentPromise = createAttachmentAction({
				name: file.name,
				key: isValidated.key,
				url: isValidated.url,
				refType: 'product',
				refID: 345
			})

			const [uploadResponse, attachmentResponse] = await Promise.all([uploadPromise, attachmentPromise])

			if (uploadResponse
				&& !uploadResponse.data?.success
				&& attachmentResponse
				&& attachmentResponse.data?.success) {
				console.log(uploadResponse.data?.response)
				setErrors(prev => [...prev, "s3 upload was not a success but database was a success"])
				const deleteAttach = await deleteAttachmentAction({ ID: attachmentResponse.data.attachment.id })

				if (deleteAttach && deleteAttach.serverError) {
					setErrors(prev => [...prev, deleteAttach.serverError!])
				}
				continue
			}

			if (uploadResponse
				&& !uploadResponse.data?.success
				&& attachmentResponse
				&& !attachmentResponse.data?.success) {
				setErrors(prev => [...prev, "both s3 upload and database failed"])
				continue
			}

			console.log("upload was a success!")
			setItems(prev => [...prev, { url: isValidated.url, type: isValidated.type }])
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxFiles: 5,
		maxSize: 4_194_304,
		accept: allowedMimetypes
	})

	const { image, pdf } = Object.groupBy(items, i => i.type)

	return (
		<SiteWrapper>
			<div
				className='border-dashed border-2 rounded-md px-6 py-10 hover:border-primary transition-colors cursor-pointer'
				{...getRootProps()}>
				<input {...getInputProps()} />
				{
					isDragActive ?
						<p>Træk og slip filer her</p> :
						<p>Træk og slip filer her, eller klik for at vælge</p>
				}
			</div>
			<div className="flex flex-col gap-1">
				{errors.length > 0 && errors.map(e => <p>{e}</p>)}
			</div>
			<div className="flex items-center gap-2">
				<p>PDF filer:</p>
				{pdf && pdf.length > 0 && pdf.map((pdf, idx) => (
					<div key={idx} className="grid place-content-center rounded-md">
						<Link href={pdf.url} target="_blank">
							<File />
						</Link>
					</div>
				))}
			</div>
			<div className="flex items-center gap-2">
				<p>Billeder:</p>
				{image && image.length > 0 && image.map((image, idx) => (
					<div key={idx} className="grid place-content-center rounded-md">
						<img className="h-60 w-60" alt="billede" src={image.url} />
					</div>
				))}
			</div>
		</SiteWrapper>
	)
}
