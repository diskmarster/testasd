"use client"

import { Attachment } from "@/lib/database/schema/attachments"
import { User } from "@/lib/database/schema/auth"
import { allowedMimetypes, fileService } from "@/service/file"
import { Dispatch, SetStateAction, useCallback, useState, useTransition } from "react"
import { useDropzone } from "react-dropzone"
import { Icons } from "../ui/icons"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Lightbox from 'yet-another-react-lightbox'
import "yet-another-react-lightbox/styles.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { createAttachmentAction, deleteAttachmentAction, deleteAttachmentAndFileAction, uploadFileAction } from "@/app/[lng]/(site)/varer/produkter/[id]/actions"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { emitCustomEvent, useCustomEventListener } from "react-custom-events"
import Link from "next/link"

interface Props {
	productID: number
	files: Attachment[]
	user: User
}

export function ProductFilesGrid({ productID, files, user }: Props) {
	const [imageIndex, setImageIndex] = useState(0)
	const [lightBoxOpen, setLightBoxOpen] = useState(false)

	const { image, pdf } = Object.groupBy(files, (f) => f.type)

	return (
		<>
			<div className="lg:w-1/2 border rounded-md p-4 flex flex-col gap-4">
				<div className='flex items-baseline gap-1.5'>
					<p>Filer</p>
					<span className='text-muted-foreground tabular-nums text-xs'>({files.length} / 5)</span>
				</div>
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">Dokumenter</p>
					<div className="flex flex-col gap-2">
						{!pdf && (
							<p className="text-muted-foreground">Ingen dokumenter fundet</p>
						)}
						{pdf && pdf.map((p, i) => (
							<PDFFile key={i} file={p} />
						))}
					</div>
				</div>
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">Billeder</p>
					<div className='flex gap-2 flex-wrap'>
						{!image && (
							<p className="text-muted-foreground">Ingen billeder fundet</p>
						)}
						{image && image.map((f, i) => (
							<ImageFile
								key={i}
								file={f}
								onClick={() => {
									setImageIndex(i)
									setLightBoxOpen(true)
								}} />
						))}
					</div>
				</div>
				{files.length < 5 && (
					<FileDropZone user={user} productID={productID} fileCount={files.length} />
				)}
			</div>
			<Lightbox
				open={lightBoxOpen}
				close={() => setLightBoxOpen(false)}
				index={imageIndex}
				slides={image?.map(i => ({ src: i.url }))}
			/>
			<DeleteFileModal />
		</>
	)
}

function PDFFile({
	file,
}: {
	file: Attachment,
}) {
	return (
		<div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 group/pdf cursor-pointer">
					<div className="text-[10px] px-1 py-0.5 rounded-sm bg-red-500 font-semibold text-white">PDF</div>
					<Link href={file.url} target="_target" className="group-hover/pdf:underline">{file.name}</Link>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button size='iconSm' variant='ghost'>
							<Icons.ellipsis className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>Vis</DropdownMenuItem>
						<DropdownMenuItem>Download</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="text-destructive" onClick={() => {
							emitCustomEvent("DeleteFileByID", { ID: file.id })
						}}>Slet</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}

function ImageFile({
	file,
	onClick
}: {
	file: Attachment,
	onClick: () => void
}) {
	return (
		<div
			className="border rounded-md flex items-center justify-center overflow-hidden group/file-image cursor-pointer max-w-32 aspect-square relative"
		>
			<div
				className="p-1.5 rounded-sm bg-destructive hover:bg-red-500 absolute top-2 right-2 group/icon z-50 opacity-0 group-hover/file-image:opacity-100 transition-opacity"
				onClick={() => {
					emitCustomEvent("DeleteFileByID", { ID: file.id })
				}}>
				<Icons.trash className="size-4 text-destructive-foreground" />
			</div>
			<Image
				onClick={() => onClick()}
				src={file.url}
				height={200}
				width={600}
				alt="billede"
				className="group-hover/file-image:scale-110 transition-transform"
			/>
		</div>
	)
}

function FileDropZone({ user, productID, fileCount }: { user: User, productID: number, fileCount: number }) {
	const [filesLoading, setFilesLoading] = useState(0)
	const [filesDone, setFilesDone] = useState(0)

	const onDrop = useCallback(async (files: File[]) => {
		if (fileCount == 5) return
		let tempCount = fileCount
		setFilesLoading(files.length)
		for (const file of files) {
			if (tempCount >= 5) {
				toast.error(siteConfig.errorTitle, { description: "Du kan ikke uploade flere end 5 filer" })
				break
			}
			tempCount++
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
				customerID: user.customerID,
				mimeType: file.type,
				refType: 'product',
				refID: 345
			})
			if (!isValidated.success) {
				toast.error(siteConfig.errorTitle, { description: isValidated.error })
				continue
			}

			const uploadPromise = uploadFileAction({ key: isValidated.key, type: file.type, body: base64 })
			const attachmentPromise = createAttachmentAction({
				name: file.name,
				key: isValidated.key,
				url: isValidated.url,
				type: isValidated.type,
				refType: 'product',
				refID: productID
			})

			const [uploadResponse, attachmentResponse] = await Promise.all([uploadPromise, attachmentPromise])

			if (uploadResponse
				&& !uploadResponse.data?.success
				&& attachmentResponse
				&& attachmentResponse.data?.success) {
				toast.error(siteConfig.errorTitle, { description: "s3 upload was not a success but database was a success" })
				const deleteAttach = await deleteAttachmentAction({ ID: attachmentResponse.data.attachment.id })

				if (deleteAttach && deleteAttach.serverError) {
					toast.error(siteConfig.errorTitle, { description: deleteAttach.serverError! })
				}
				continue
			}

			if (uploadResponse
				&& !uploadResponse.data?.success
				&& attachmentResponse
				&& !attachmentResponse.data?.success) {
				toast.error(siteConfig.errorTitle, { description: 'both s3 upload and database failed' })
				continue
			}

			setFilesDone(prev => prev + 1)
		}
		setFilesLoading(0)
		setFilesDone(0)
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxFiles: Math.max(5 - fileCount, 0),
		maxSize: 4_194_304,
		accept: allowedMimetypes
	})

	return (

		<div
			className={cn('mt-auto border-dashed border py-4 rounded-md grid place-items-center hover:border-primary transition-colors cursor-pointer group/dropzone', isDragActive && 'bg-primary/20')}
			{...getRootProps()}>
			<input {...getInputProps()} />
			<div className='flex items-center gap-2'>
				{filesLoading > 0 && filesLoading > filesDone ? (
					<>
						<Icons.spinner className='size-4 text-primary animate-spin' />
						<p className='text-sm'>Uploader {filesDone} af {filesLoading} filer</p>
					</>
				) : (
					<>
						<Icons.plus className='h-4 w-4 text-primary group-hover/dropzone:rotate-180 transition-transform' />
						<p className='text-sm'>{isDragActive ? 'Træk og slip her' : 'Træk og slip filer, eller klik for at vælge'}</p>
					</>
				)}
			</div>
		</div>
	)
}

function DeleteFileModal() {
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [ID, setID] = useState<number>()

	function onOpenChange(open: boolean) {
		setOpen(open)
		setID(undefined)
	}

	useCustomEventListener("DeleteFileByID", (data: { ID: number }) => {
		setID(data.ID)
		setOpen(true)
	})

	function deleteFile() {
		if (!ID) return
		startTransition(async () => {
			const res = await deleteAttachmentAndFileAction({ id: ID })
			if (res && res.serverError) {
				toast.error("Der gik noget galt", { description: res.serverError })
				return
			}
			onOpenChange(false)
			toast.success("Fil blev slettet", { description: "Din fil er nu slettet" })
		})
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your account
						and remove your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex items-center gap-2">
					<Button
						type='button'
						size='lg'
						variant='secondary'
						className='w-full'
						onClick={() => onOpenChange(false)}>
						Luk
					</Button>
					<Button
						disabled={pending}
						variant='destructive'
						size='lg'
						className='w-full gap-2'
						onClick={() => deleteFile()}>
						{pending && <Icons.spinner className='size-4 animate-spin' />}
						Slet
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
