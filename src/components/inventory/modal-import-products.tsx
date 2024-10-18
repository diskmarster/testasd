'use client'

import { finishProductsAction, importProductsAction } from '@/app/(site)/admin/produkter/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Icons } from '@/components/ui/icons'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { useMediaQuery } from '@/hooks/use-media-query'
import { readAndValidateFileData } from '@/lib/import/file-reader'
import Link from 'next/link'
import { useCallback, useState, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { z, ZodError } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { productsDataValidation } from '@/app/(site)/admin/produkter/validation'
import { chunkArray } from '@/lib/utils'
import { Progress } from '../ui/progress'
import { ScrollArea } from '../ui/scroll-area'


export function ModalImportProducts() {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [uploadedAmount, setUploadedAmount] = useState(0)
  const [responseErrors, setResponseErrors] = useState<string[]>([])
  const [isDone, setIsDone] = useState(false)


  const [rows, setRows] = useState<z.infer<typeof productsDataValidation>>([])
  const [errors, setErrors] = useState<
    ZodError<typeof productsDataValidation> | undefined
  >(undefined)
  const desktop = '(min-width: 768px)'
  const isDesktop = useMediaQuery(desktop)

  const onDrop = useCallback(async (files: File[]) => {
    setIsReading(true)
    setErrors(undefined)
    setRows([])
    setIsDone(false)

    const dataRes = await readAndValidateFileData(
      files[0],
      productsDataValidation,
    )
    setIsReading(false)

    if (!dataRes.success) {
      setErrors(dataRes.errors)
    } else {
      setRows(dataRes.data.slice(0, 3000))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
  })

  function onOpenChange(open: boolean) {
    if (pending) return
    setOpen(open)
    setRows([])
    setErrors(undefined)
    setResponseErrors([])
    setUploadedAmount(0)
    setIsDone(false)
  }

  function onSubmit(values: z.infer<typeof productsDataValidation>) {
    setErrors(undefined)
    setResponseErrors([])
    setUploadedAmount(0)
    setIsDone(false)

    startTransition(async () => {
      const CHUNK_SIZE = 50

      const chunkedArray = chunkArray(values, CHUNK_SIZE)

      for (let i = 0; i < chunkedArray.length; i++) {
        const chunk = chunkedArray[i]
        const start = i * CHUNK_SIZE
        const errorMsg = `Der gik noget galt med rækkerne fra ${start + 1} til ${start + CHUNK_SIZE}.`
        const res = await importProductsAction(chunk)

        if (res && res.serverError) {
          setResponseErrors(prev => [`${errorMsg} ${res.serverError}`, ...prev])
          continue
        }

        setUploadedAmount(prev => prev + CHUNK_SIZE)
      }
      setIsDone(true)
      setRows([])
      await finishProductsAction()
    })

  }

  if (!isDesktop) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size='icon' variant='outline' onClick={() => setOpen(true)}>
          <Icons.cloudUpload className='size-[18px]' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Import varekartotek</DialogTitle>
          <DialogDescription>
            Når du importerer et varekartotek, oprettes der automatisk en nul-beholdning for alle jeres lokationer, hvis et produkt ikke allerede findes. Hvis produktet allerede eksisterer, vil det blive opdateret. Eventuelle nye varegrupper, der er angivet, vil også automatisk blive oprettet.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>

          <div className='grid gap-2'>
            <Label>Før du uploader</Label>
            <p className='text-muted-foreground text-sm'>
              Din import fil skal opfylde visse kritirier før den kan uploades.
              Se venligst eksempel filen for at se opbygningen.
            </p>
            <p className='text-muted-foreground text-sm'>
              Er du i tvivl om hvordan du skal skrive dine værdier, så se
              venligst på vores F.A.Q under{' '}
              <Link href={'/faq?spørgsmål=Hvordan formaterer jeg min import fil til varekartoteket?'} target='_blank' className='underline'>
                &quot;Hvordan formaterer jeg min import fil til
                varekartoteket?&quot;
              </Link>
            </p>
          </div>
          <div className='border rounded-md p-4 flex items-center justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Icons.sheet className='size-[18px] text-primary' />

                <p className='text-sm'>Fil eksempel</p>
              </div>
              <p className='text-xs text-muted-foreground'>
                Se hvordan import filen skal se ud
              </p>
            </div>
            <a
              className={buttonVariants({ size: 'sm', variant: 'outline' })}
              href={'/product-import-example.xlsx'}
              rel='noopener noreferrer'
              download>
              Download
            </a>
          </div>
          <div
            {...getRootProps()}
            className='border-dashed border-2 rounded-md px-6 py-10 hover:border-primary transition-colors cursor-pointer'>
            <input {...getInputProps()} />
            <div className='text-muted-foreground text-sm grid place-items-center'>
              {isReading ? (
                <div className='flex gap-2 items-center'>
                  <p>Indlæser filen</p>
                  <Icons.spinner className='animate-spin size-3' />
                </div>
              ) : rows.length > 0 ? (
                <p>Indlæst og klartgjort {rows.length} rækker til upload</p>
              ) : (
                <p>
                  {isDragActive
                    ? 'Træk og slip din import fil her'
                    : 'Træk og slip din import fil her, eller klik for at vælge'}
                </p>
              )}
            </div>
          </div>
          {errors && (
            <div className='flex flex-col gap-1 text-destructive text-sm'>
              <p className='font-semibold'>{siteConfig.errorTitle}</p>
              {errors.issues.slice(0, 5).map((issue, i) => {
                const rowNumber = Number(issue.path[0]) + 1
                const rowKey =
                  issue.code == 'unrecognized_keys'
                    ? issue.keys[0]
                    : issue.path[1]
                const rowMsg = issue.message

                return (
                  <div key={i}>
                    <p>{`Fejl på række ${rowNumber} i ${rowKey}: ${rowMsg}`}</p>
                  </div>
                )
              })}
              {errors.issues.length > 5 && <p className='text-foreground'>{errors.issues.length - 5} fejl mere...</p>}
            </div>
          )}
          {responseErrors.length > 0 && (
            <Alert variant='destructive' className='border-destructive'>
              <Icons.alert className='size-4 !top-3 ' />
              <AlertTitle className=''>{siteConfig.errorTitle}</AlertTitle>
              <ScrollArea maxHeight='max-h-[140px]'>
                {responseErrors.map((e, i) => (
                  <AlertDescription key={i}>{e}</AlertDescription>
                ))}
              </ScrollArea>
            </Alert>
          )}
          {isDone && responseErrors.length == 0 && (
            <Alert variant='default' className='border-success'>
              <Icons.check className='size-4 !top-3 text-success' />
              <AlertTitle className='text-success'>Importering fuldført</AlertTitle>
              <AlertDescription className='text-success'>Importering af dit varekartotek er nu færdigt</AlertDescription>
            </Alert>
          )}
          {pending && (
            <Progress max={100} value={uploadedAmount / rows.length * 100} />
          )}
          <Button
            disabled={pending || rows.length == 0}
            variant='default'
            size='lg'
            className='w-full gap-2'
            onClick={() => onSubmit(rows)}>
            {pending ? `${uploadedAmount} uploadet af ${rows.length}` : 'Upload til varekartotek'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
