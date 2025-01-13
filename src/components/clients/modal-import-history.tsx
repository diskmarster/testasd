"use client"

import { importHistoryDataValidation } from "@/app/[lng]/(site)/sys/kunder/validation"
import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { useMediaQuery } from "@/hooks/use-media-query"
import { readAndValidateFileData } from "@/lib/import/file-reader"
import { useCallback, useState, useTransition } from "react"
import { useCustomEventListener } from "react-custom-events"
import { useDropzone } from "react-dropzone"
import { z, ZodError } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "../ui/label"
import { Icons } from "../ui/icons"
import { Button, buttonVariants } from "../ui/button"
import { siteConfig } from "@/config/site"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { ScrollArea } from "../ui/scroll-area"
import { Progress } from "../ui/progress"
import { chunkArray } from "@/lib/utils"
import { fetchLocationsForCustomerActions, importHistoryAction } from "@/app/[lng]/(site)/sys/kunder/actions"
import { CustomerID } from "@/lib/database/schema/customer"
import { LocationWithCounts } from "@/data/location.types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export function ModalImportClientHistory() {
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'kunder')
  const validationSchema = importHistoryDataValidation(t)

  const [customerID, setCustomerID] = useState<number>()
  const [open, setOpen] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [rows, setRows] = useState<z.infer<typeof validationSchema>>([])
  const [errors, setErrors] = useState<
    ZodError<typeof validationSchema> | undefined
  >(undefined)
  const [uploadedAmount, setUploadedAmount] = useState(0)
  const [responseErrors, setResponseErrors] = useState<string[]>([])
  const [locations, setLocations] = useState<{ id: string, name: string }[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>()
  const [skippedSkus, setSkippedSkus] = useState<string[]>([])

  const desktop = '(min-width: 768px)'
  const isDesktop = useMediaQuery(desktop)

  useCustomEventListener("ImportClientHistoryByID", (data: any) => {
    setCustomerID(data.customerID)
    fetchLocations(data.customerID)
    setOpen(true)
  })

  const onDrop = useCallback(async (files: File[]) => {
    setIsReading(true)
    setErrors(undefined)
    setRows([])
    setIsDone(false)

    const dataRes = await readAndValidateFileData(files[0], validationSchema, true)
    setIsReading(false)

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
    },
  })

  function fetchLocations(customerID: CustomerID) {
    startTransition(async () => {
      const res = await fetchLocationsForCustomerActions({ customerID: customerID })
      setLocations(res?.data ?? [])
    })
  }

  function onOpenChange(open: boolean) {
    if (pending) return
    setOpen(open)
    setRows([])
    setErrors(undefined)
    setResponseErrors([])
    setUploadedAmount(0)
    setSelectedLocation(undefined)
    setCustomerID(undefined)
    setSkippedSkus([])
    setIsDone(false)
  }

  function onSubmit(values: z.infer<typeof validationSchema>) {
    if (!customerID || !selectedLocation) return

    setErrors(undefined)
    setResponseErrors([])
    setUploadedAmount(0)
    setIsDone(false)
    setSkippedSkus([])

    startTransition(async () => {
      const CHUNK_SIZE = 50

      const chunkedArray = chunkArray(values, CHUNK_SIZE)

      for (let i = 0; i < chunkedArray.length; i++) {
        const chunk = chunkedArray[i]
        const start = i * CHUNK_SIZE
        const errorMsg = t('import-history-modal.error-from', { from: start + 1, to: start + chunk.length })
        const res = await importHistoryAction({
          customerID: customerID,
          locationID: selectedLocation,
          items: chunk
        })

        if (res && res.validationErrors) {
          console.log("val err", res.validationErrors)
          continue
        }
        if (res && res.serverError) {
          setResponseErrors(prev => [`${errorMsg} ${res.serverError}`, ...prev])
          continue
        }

        if (res && res.data && res.data != undefined) {
          const newArr = [...skippedSkus, ...res.data]
          setSkippedSkus(newArr)
        }
        setUploadedAmount(prev => prev + chunk.length)
      }
      setRows([])
      setIsDone(true)
    })
  }

  if (!isDesktop) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('import-history-modal.title')}</DialogTitle>
          <DialogDescription>
            {t('import-history-modal.description')}
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className="grid gap-2">
            <Label>{t('import-history-modal.location-label')}</Label>
            <Select value={selectedLocation} onValueChange={val => setSelectedLocation(val)}>
              <SelectTrigger>
                {locations.length > 0 ? (
                  <SelectValue placeholder="Vælg lokation" defaultValue={selectedLocation} />
                ) : (
                  <SelectValue placeholder="Henter lokationer..." defaultValue={selectedLocation} />
                )}
              </SelectTrigger>
              <SelectContent>
                {locations.map((l, i) => (
                  <SelectItem key={i} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label>{t('import-history-modal.before-upload')}</Label>
            <p className='text-muted-foreground text-sm'>
              {t('import-history-modal.import-criteria')}
            </p>
          </div>
          <div className='border rounded-md p-4 flex items-center justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Icons.sheet className='size-[18px] text-primary' />

                <p className='text-sm'>
                  {t('import-history-modal.file-example')}
                </p>
              </div>
              <p className='text-xs text-muted-foreground'>
                {t('import-history-modal.file-import-example')}
              </p>
            </div>
            <a
              className={buttonVariants({ size: 'sm', variant: 'outline' })}
              href={'/assets/history-import-example.xlsx'}
              rel='noopener noreferrer'
              download>
              {t('import-history-modal.download')}
            </a>
          </div>
          <div
            {...getRootProps()}
            className='border-dashed border-2 rounded-md px-6 py-10 hover:border-primary transition-colors cursor-pointer'>
            <input {...getInputProps()} />
            <div className='text-muted-foreground text-sm grid place-items-center'>
              {isReading ? (
                <div className='flex gap-2 items-center'>
                  <p>{t('import-history-modal.loading-the-file')}</p>
                  <Icons.spinner className='animate-spin size-3' />
                </div>
              ) : rows.length > 0 ? (
                <p>
                  {t('import-history-modal.loaded-and-ready', { amount: rows.length })}
                </p>
              ) : (
                <p>
                  {isDragActive
                    ? t('import-history-modal.drag-and-drop2')
                    : t('import-history-modal.drag-and-drop')}
                </p>
              )}
            </div>
          </div>
          {errors && (
            <div className='flex flex-col gap-1 text-destructive text-sm'>
              <p className='font-semibold'>{t(siteConfig.errorTitle)}</p>
              {errors.issues.slice(0, 5).map((issue, i) => {
                const rowNumber = Number(issue.path[0]) + 2
                const rowKey =
                  issue.code == 'unrecognized_keys'
                    ? issue.keys[0]
                    : issue.path[1]
                const rowMsg = issue.message

                return (
                  <div key={i}>
                    <p>{t('import-history-modal.error-message', { rowNum: rowNumber, rowKey: rowKey, rowMsg: rowMsg })}</p>
                  </div>
                )
              })}
              {errors.issues.length > 5 && (
                <p className='text-foreground'>
                  {errors.issues.length - 5}{' '}
                  {t('import-history-modal.more-errors')}
                </p>
              )}
            </div>
          )}
          {responseErrors.length > 0 && (
            <Alert variant='destructive' className='border-destructive'>
              <Icons.alert className='size-4 !top-3 ' />
              <AlertTitle className=''>{t(siteConfig.errorTitle)}</AlertTitle>
              <ScrollArea maxHeight='max-h-[140px]'>
                {responseErrors.map((e, i) => (
                  <AlertDescription key={i}>{e}</AlertDescription>
                ))}
              </ScrollArea>
            </Alert>
          )}
          {isDone && responseErrors.length == 0 && (
            <Alert variant='default' className='border-success'>
              <Icons.check className='size-4 !top-3 !text-success' />
              <AlertTitle className='text-success font-semibold'>
                {t('import-history-modal.completed-title')}
              </AlertTitle>
              <AlertDescription className=' flex flex-col gap-2'>
                {t('import-history-modal.completed-description')}
                {skippedSkus.length > 0 && (
                  <div className="space-y-1 max-h-20">
                    <p>{t("import-history-modal.skipped-skus")}</p>
                    <ScrollArea>
                      <ul className="list-inside list-disc pl-2">
                        {skippedSkus.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          {(pending && rows.length > 0) && (
            <Progress max={100} value={(uploadedAmount / rows.length) * 100} />
          )}
          <Button
            disabled={pending || rows.length == 0 || !selectedLocation}
            variant='default'
            size='lg'
            className='w-full gap-2'
            onClick={() => onSubmit(rows)}>
            {(pending && rows.length > 0)
              ? t('import-history-modal.upload-progress', { uploaded: uploadedAmount, max: rows.length })
              : t('import-history-modal.upload-button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
