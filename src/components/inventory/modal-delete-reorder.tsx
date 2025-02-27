'use client'

import { deleteReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { deleteReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Product } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogV2 } from '../ui/dialog-v2'

interface Props {
  products: Product[]
}

export function ModalDeleteReorder({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = deleteReorderValidation(validationT)

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
  })

  const formValues = watch()

  useCustomEventListener('DeleteReorderByIDs', (data: any) => {
    setOpen(true)
    setValue('productID', data.productID, { shouldValidate: true })
    setValue('locationID', data.locationID, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const res = await deleteReorderAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.delete-reorder')} ${products.find(prod => prod.id == formValues.productID)?.text1}`,
      })
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  return (
    <DialogV2 open={open} onOpenChange={onOpenChange}>
      <DialogContentV2 className='md:max-w-sm'>
        <DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.trash className="size-4 text-destructive" />
						<DialogTitleV2 className='text-sm'>{t('modal-delete-reorder.title')}</DialogTitleV2>
					</div>
        </DialogHeaderV2>
          <form
						id="delete-reorder-form"
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4  px-3'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
					<p className="text-sm text-muted-foreground">{t("modal-delete-reorder.description")}</p>
          </form>
					<DialogFooterV2>
                <Button
								onClick={() => setOpen(false)}
                  type='button'
                  size='sm'
                  variant='outline'>
                  {t('modal-delete-reorder.cancel-button')}
                </Button>
              <Button
								form='delete-reorder-form'
                disabled={
                  !formState.isValid || pending || formState.isSubmitting
                }
                variant='destructive'
                size='sm'
                className='flex items-center gap-2'>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                {t('modal-delete-reorder.delete-button')}
              </Button>
					</DialogFooterV2>
      </DialogContentV2>
    </DialogV2>
  )
}
