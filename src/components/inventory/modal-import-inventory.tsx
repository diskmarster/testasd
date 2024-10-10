'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { siteConfig } from '@/config/site'
import { useMediaQuery } from '@/hooks/use-media-query'
import { readAndValidateFileData } from '@/lib/import/file-reader'
import Link from 'next/link'
import { useCallback, useState, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { z, ZodError } from 'zod'
import { Button, buttonVariants } from '../ui/button'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'

const units = ['stk', 'kg', 'kasse'] as const

const importFileValidation = z.array(
  z
    .object({
      text1: z
        .string({ required_error: 'Varetekst 1 skal være udfyldt' })
        .min(1, { message: 'Varetekst 1 skal være minimum 1 karakter lang' }),
      text2: z.string().optional().default(''),
      text3: z.string().optional().default(''),
      sku: z.coerce.string().min(1, { message: 'Varenr. skal være udfyldt' }),
      date: z.coerce.date({
        invalid_type_error: 'Kan ikke læse datoen',
        message: 'Dato skal være udfyldt',
      }),
      costPrice: z.coerce
        .number({ invalid_type_error: 'Kostpris skal være et nummer' })
        .default(0),
      unit: z.preprocess(
        // @ts-ignore - string is not the same as the value in units bla bla shut up typescript
        (val: string) => val.trim().toLowerCase(),
        z.enum(units, {
          invalid_type_error: `Ukendt enhed. Brug f.eks. ${units.join(', ')}`,
          message: `Ukendt enhed. Brug f.eks. ${units.join(', ')}`,
        }),
      ),
      barred: z
        .string()
        .refine(
          value =>
            value === 'true' ||
            value === 'false' ||
            value === 'ja' ||
            value === 'nej',
          {
            message: 'Ukendt værdi i spærret. Brug true, false, ja eller nej',
          },
        )
        .transform(value => value === 'true' || value === 'ja'),
    })
    .strict({ message: 'Ukendt kolonne' }),
)

export function ModalImportInventory() {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<z.infer<typeof importFileValidation>>([])
  const [errors, setErrors] = useState<
    ZodError<typeof importFileValidation> | undefined
  >(undefined)
  const desktop = '(min-width: 768px)'
  const isDesktop = useMediaQuery(desktop)

  const onDrop = useCallback(async (files: File[]) => {
    setErrors(undefined)
    setRows([])

    const dataRes = await readAndValidateFileData(
      files[0],
      importFileValidation,
      true,
    )

    if (!dataRes.success) {
      setErrors(dataRes.errors)
    } else {
      setRows(dataRes.data)
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
    setOpen(open)
    setRows([])
    setErrors(undefined)
  }

  if (!isDesktop) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button size='icon' variant='outline' onClick={() => setOpen(true)}>
          <Icons.cloudUpload className='size-[18px]' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Import beholdning</DialogTitle>
          <DialogDescription>
            Når du importere din beholdning, opretter vi automatisk nye
            varegrupper, produkter, placeringer og batchnumre hvis de er angivet
            i import filen
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
              <Link href={'/faq'} target='_blank' className='underline'>
                &quot;Hvordan formaterer jeg min import fil til
                beholdning?&quot;
              </Link>
            </p>
          </div>
          <div className='border rounded-md p-4 flex items-center justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Icons.sheet className='size-[18px]' />

                <p className='text-sm'>Fil eksempel</p>
              </div>
              <p className='text-xs text-muted-foreground'>
                Se hvordan import filen skal se ud
              </p>
            </div>
            <a
              className={buttonVariants({ size: 'sm', variant: 'outline' })}
              href={'/import_example.csv'}
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
              {rows.length > 0 ? (
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
                const rowNumber = Number(issue.path[0])
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
            </div>
          )}
          <Button
            disabled={pending || rows.length == 0}
            variant='default'
            size='lg'
            className='w-full gap-2'>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
