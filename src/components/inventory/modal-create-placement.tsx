'use client'
import { createPlacementAction } from '@/app/(site)/admin/placering/actions'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const createPlacementValidation = z.object({
  placementName: z
    .string()
    .min(1, 'Placering navn er påkrævet')
    .max(50, 'Placering navn må ikke være længere end 50 tegn'),
})

interface CreatePlacementForm {
  placementName: string
}

export function ModalCreatePlacement() {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreatePlacementForm>({
    resolver: zodResolver(createPlacementValidation),
  })

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const router = useRouter()

  const onSubmit = async (data: CreatePlacementForm) => {
    try {
      await createPlacementAction({
        placementName: data.placementName,
      })

      toast.success('Placering oprettet', {
        description: `Ny placering: ${data.placementName}`,
      })

      setOpen(false)

      router.refresh()
    } catch (error) {
      toast.error('Noget gik galt', {
        description: 'Kunne ikke oprette placeringen. Prøv igen senere.',
      })
    }
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
          <CredenzaTitle>Opret ny placering</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            <div className='grid gap-2'>
              <Label>Placering navn</Label>
              <Input
                placeholder='Indtast navn for ny placering'
                {...register('placementName')}
              />
              {errors.placementName && (
                <p className='text-sm text-destructive'>
                  {errors.placementName.message}
                </p>
              )}
            </div>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting}
              className='w-full'>
              {isSubmitting ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                'Opret placering'
              )}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
