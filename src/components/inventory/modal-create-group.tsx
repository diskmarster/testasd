'use client'

import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { LanguageContext } from '@/context/language'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { createGroupValidation } from '@/app/[lng]/(site)/varer/varegrupper/validation'
import { createGroupAction } from '@/app/[lng]/(site)/varer/varegrupper/actions'

export function ModalCreateProductGroup() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'varegrupper')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = createGroupValidation(validationT)

  const { handleSubmit, register, formState, reset } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    startTransition(async () => {
      const res = await createGroupAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${values.name} ${t('toasts.create-group')}}`,
      })
    })
  }
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>{t('create-product-group-modal.title')}</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>
                  {toast.error(t(`common:${siteConfig.errorTitle}`))}
                </AlertTitle>
                <AlertDescription></AlertDescription>
              </Alert>
            )}
            <div className='grid gap-2'>
              <Label>{t('create-product-group-modal.name')}</Label>
              <Input
                placeholder={t('create-product-group-modal.name-placeholder')}
                {...register('name')}
              />
              {formState.errors.name && (
                <p className='text-sm text-destructive'>
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            <Button
              type='submit'
              disabled={pending || !formState.isValid}
              className='w-full md:w-auto'>
              {t('create-product-group-modal.create-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
