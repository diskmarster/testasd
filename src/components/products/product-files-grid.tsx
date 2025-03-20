"use client"

import { Attachment } from "@/lib/database/schema/attachments"
import { User } from "@/lib/database/schema/auth"
import { allowedMimetypes, fileService, MimeType } from "@/service/file"
import { useCallback, useState, useTransition } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { Icons } from "../ui/icons"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Lightbox from 'yet-another-react-lightbox'
import "yet-another-react-lightbox/styles.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { createAttachmentAction, deleteAttachmentAction, deleteAttachmentAndFileAction, fetchProductFiles, uploadFileAction } from "@/app/[lng]/(site)/varer/produkter/[id]/actions"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { emitCustomEvent, useCustomEventListener } from "react-custom-events"
import Link from "next/link"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Skeleton } from "../ui/skeleton"

interface Props {
	productID: number
	files: Attachment[]
	user: User
}

export function ProductFilesGrid({ productID, files, user }: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	const [imageIndex, setImageIndex] = useState(0)
	const [lightBoxOpen, setLightBoxOpen] = useState(false)

	function fetchFiles(id: number) {
		startTransition(async () => {
			const res = await fetchProductFiles({ id: id })
			if (res && res.data) {
				files = res.data
			}
		})
	}

	useCustomEventListener('FetchNewFiles', (data: { id: number }) => {
		fetchFiles(data.id)
	})

	const { image, pdf } = Object.groupBy(files, (f) => f.type)

	return (
		<>
			<div className="lg:w-1/2 flex-1 border rounded-md p-4 flex flex-col gap-4">
				<div className='flex items-center gap-1.5'>
					<p className="font-medium">{t("details-page.files.title")}</p>
					<span className='text-muted-foreground tabular-nums text-xs'>({files.length} / 5)</span>
					{pending && (
						<Icons.spinner className="size-3 animate-spin" />
					)}
				</div>
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">{t("details-page.files.documents")}</p>
					<div className="flex flex-col">
						{!pdf && (
							<p className="text-muted-foreground">{t("details-page.files.no-documents")}</p>
						)}
						{pdf && pdf.map((p, i) => (
							<PDFFile key={`${p.id}-${i}`} file={p} />
						))}
					</div>
				</div>
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">{t("details-page.files.images")}</p>
					<div className='flex gap-2 flex-wrap'>
						{!image && (
							<p className="text-muted-foreground">{t("details-page.files.no-images")}</p>
						)}
						{image && image.map((f, i) => (
							<ImageFile
								key={`${f.id}-${i}`}
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
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')
	return (
		<div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 group/pdf cursor-pointer">
					<div className="text-[10px] px-1 py-0.5 rounded-sm bg-red-500 font-semibold text-white">PDF</div>
					<Link href={file.url} target="_target" className="group-hover/pdf:underline text-sm">{file.name}</Link>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button size='iconSm' variant='ghost'>
							<Icons.ellipsis className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>{t("details-page.files.document-show")}</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="text-destructive" onClick={() => {
							emitCustomEvent("DeleteFileByID", { id: file.id, refID: file.refID })
						}}>{t("details-page.files.document-delete")}</DropdownMenuItem>
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
			className="border rounded-md flex items-center justify-center overflow-hidden group/file-image cursor-pointer max-w-20 aspect-square relative"
		>
			<div
				className="p-1.5 rounded-sm bg-destructive hover:bg-red-500 absolute top-2 right-2 group/icon z-50 opacity-0 group-hover/file-image:opacity-100 transition-opacity"
				onClick={() => {
					emitCustomEvent("DeleteFileByID", { id: file.id, refID: file.refID })
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
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	const [filesLoading, setFilesLoading] = useState(0)
	const [filesDone, setFilesDone] = useState(0)

	const onDrop = useCallback(async (files: File[], rejectedFiles: FileRejection[]) => {
		if (rejectedFiles.length > 0) {
			for (const file of rejectedFiles) {
				console.log(file.errors[0].code)
				toast.error(t(siteConfig.errorTitle), { description: t('details-page.files.file-rejected', { context: file.errors[0].code, name: file.file.name }) })
			}
		}
		if (files.length === 0) return
		setFilesLoading(files.length)
		for (const file of files) {
			const arrayBuffer = await file.arrayBuffer()
			const buffer = new Uint8Array(arrayBuffer)
			let base64: string

			// @ts-ignore
			if (Uint8Array.prototype.toBase64) {
				// @ts-ignore 
				base64 = buffer.toBase64('base64url')
			} else {
				let binary = ""
				for (let i = 0; i < buffer.length; i++) {
					binary += String.fromCharCode(buffer[i])
				}
				base64 = btoa(binary)
			}

			const isValidated = fileService.validate({
				customerID: user.customerID,
				mimeType: file.type as MimeType,
				refType: 'product',
				refID: productID
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
				toast.error(siteConfig.errorTitle, { description: t("details-page.files.upload-error") })
				const deleteAttach = await deleteAttachmentAction({ id: attachmentResponse.data.attachment.id })

				if (deleteAttach && deleteAttach.serverError) {
					toast.error(siteConfig.errorTitle, { description: deleteAttach.serverError! })
				}
				continue
			}

			if (uploadResponse
				&& !uploadResponse.data?.success
				&& attachmentResponse
				&& !attachmentResponse.data?.success) {
				toast.error(siteConfig.errorTitle, { description: t("details-page.files.upload-error") })
				continue
			}

			setFilesDone(prev => prev + 1)
		}
		setFilesLoading(0)
		setFilesDone(0)
		emitCustomEvent('FetchNewFiles', { id: productID })
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxFiles: Math.max(5 - fileCount, 0),
		maxSize: 3_000_000,
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
						<p className='text-sm'>{t("details-page.files.currently-uploading", { current: filesDone, max: filesLoading })}</p>
					</>
				) : (
					<>
						<Icons.plus className='h-4 w-4 text-primary group-hover/dropzone:rotate-180 transition-transform' />
						<p className='text-sm'>{isDragActive ? t("details-page.files.drag-active") : t("details-page.files.drag-inactive")}</p>
					</>
				)}
			</div>
		</div>
	)
}

function DeleteFileModal() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [id, setID] = useState<number>()
	const [refID, setRefID] = useState<number>()

	function onOpenChange(open: boolean) {
		setOpen(open)
		setID(undefined)
	}

	useCustomEventListener("DeleteFileByID", (data: { id: number, refID: number }) => {
		setID(data.id)
		setRefID(data.refID)
		setOpen(true)
	})

	function deleteFile() {
		if (!id) return
		startTransition(async () => {
			const res = await deleteAttachmentAndFileAction({ id: id })
			if (res && res.serverError) {
				toast.error("Der gik noget galt", { description: res.serverError })
				return
			}
			onOpenChange(false)
			toast.success("Fil blev slettet", { description: t("details-page.files.delete-success") })
			emitCustomEvent('FetchNewFiles', { id: refID })
		})
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-sm">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("details-page.files.delete-title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("details-page.files.delete-description")}</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex items-center gap-2">
					<Button
						type='button'
						size='lg'
						variant='secondary'
						className='w-full'
						onClick={() => onOpenChange(false)}>
						{t("details-page.files.delete-close")}
					</Button>
					<Button
						disabled={pending}
						variant='destructive'
						size='lg'
						className='w-full gap-2'
						onClick={() => deleteFile()}>
						{pending && <Icons.spinner className='size-4 animate-spin' />}
						{t("details-page.files.delete-confirm")}
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function FilesSkeleton() {
	return (
		<div className="lg:w-1/2 border rounded-md p-4 flex flex-col gap-4">
			<Skeleton className="h-9 w-1/3" />
			<Skeleton className="h-9 w-[85px]" />
			<Skeleton className="h-9 w-[85px]" />
		</div>
	)
}
