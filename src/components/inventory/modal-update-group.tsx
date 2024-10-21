import { updateGroupAction } from '@/app/[lng]/(site)/admin/varegrupper/actions'
import { createGroupValidation } from '@/app/[lng]/(site)/admin/varegrupper/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { LanguageContext } from '@/context/language'
import { Group } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '../ui/credenza'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export function ModalUpdateGroup({
  groupToEdit,
  isOpen,
  setOpen,
}: {
  groupToEdit?: Group
  isOpen: boolean
  setOpen: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'varegrupper')

  const { handleSubmit, register, formState, setValue, reset, watch } = useForm<
    z.infer<typeof createGroupValidation>
  >({
    resolver: zodResolver(createGroupValidation),
    defaultValues: {
      name: groupToEdit?.name || '',
    },
  })

  async function onSubmit(values: z.infer<typeof createGroupValidation>) {
    startTransition(async () => {
      if (!groupToEdit) {
        setError(t('update-product-group-modal.no-product-group'))
        return
      }

      const response = await updateGroupAction({
        groupID: groupToEdit.id,
        data: values,
      })

      if (response && response.serverError) {
        setError(response.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${values.name} ${t('toasts.update-group')}`,
      })
    })
  }

  useEffect(() => {
    if (groupToEdit) {
      setValue('name', groupToEdit.name)
    }
  }, [groupToEdit, setValue])

  function onOpenChange(open: boolean) {
    setOpen(open)
    reset()
    setError(undefined)
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>{t('update-product-group-modal.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('update-product-group-modal.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='mt-2 mb-2'>
              <div className=''>
                <Label htmlFor='sku'>
                  {t('update-product-group-modal.name')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='name' type='text' {...register('name')} />
                {formState.errors.name && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type='submit'
              disabled={pending || !formState.isValid}
              className='w-full md:w-auto'>
              {t('update-product-group-modal.update-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
