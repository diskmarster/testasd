'use client'
import { siteConfig } from '@/config/site'
import { Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState, useTransition } from 'react'
import { FieldArrayWithId, useFieldArray, UseFieldArrayRemove, useForm, UseFormSetValue } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '../ui/credenza'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { createProductValidation } from '@/app/[lng]/(site)/varer/produkter/validation'
import { createProductAction } from '@/app/[lng]/(site)/varer/produkter/actions'
import { Location, LocationID } from '@/lib/database/schema/customer'
import { hasPermissionByPlan } from '@/data/user.types'
import { Plan } from '@/data/customer.types'
import { ScrollArea } from '../ui/scroll-area'
import { TFunction } from 'i18next'

export function CreateProductsForm({
	customerPlan,
  units,
  groups,
	locations,
	locationPlacementMap,
}: {
	customerPlan: Plan
  units: Unit[]
  groups: Group[]
	locations: Location[]
	locationPlacementMap: Map<LocationID, Placement[]>
}) {
  const lng = useLanguage()
  const { user } = useSession()
  const { t } = useTranslation(lng, 'produkter')
  const [pending, startTransition] = useTransition()
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string>()
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = createProductValidation(validationT)

  const { handleSubmit, register, formState, setValue, reset, control } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      customerID: user!.customerID,
      costPrice: 0,
      salesPrice: 0,
			defaults: [],
    },
  })

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'defaults',
	})

  async function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const response = await createProductAction(values)
      if (response && response.serverError) {
        setError(response.serverError)
        return
      }
      setShow(false)
      setError(undefined)
      reset()
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: t('toast-success'),
      })
    })
  }
  function onOpenChange(open: boolean) {
    setShow(open)
    reset()
    setError(undefined)
  }

  return (
    <Credenza open={show} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline' tooltip={t('tooltips.create-product')}>
          <Icons.plus className='size-5' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg max-h-screen'>
        <CredenzaHeader>
          <CredenzaTitle>{t('product-modal-title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('product-modal-description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='grid gap-4 mb-4 md:mb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='sku'>
                  {t('product-No.')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='sku' type='text' {...register('sku')} />
                {formState.errors.sku && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.sku.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='barcode'>
                  {t('barcode')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='barcode' type='text' {...register('barcode')} />
                {formState.errors.barcode && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.barcode.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='groupID'>
                  {t('product-group')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Select
                  onValueChange={(value: string) =>
                    setValue('groupID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={t('product-group-placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='unitID'>
                  {t('unit')} <span className='text-destructive'> * </span>
                </Label>
                <Select
                  onValueChange={(value: string) =>
                    setValue('unitID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={t('unit-placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='text1'>
                  {t('product-text1')}{' '}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input
                  id='text1'
                  type='text'
                  {...register('text1')}
                  className=''
                />
                {formState.errors.text1 && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.text1.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='text2'>{t('product-text2')}</Label>
                <Input
                  id='text2'
                  type='text'
                  {...register('text2')}
                  className=''
                />
                {formState.errors.text2 && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.text2.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='text3'>{t('product-text3')}</Label>
                <Input
                  id='text3'
                  type='text'
                  {...register('text3')}
                  className=''
                />
                {formState.errors.text3 && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.text3.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='costPrice'>
                  {t('cost-price')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input
                  step={0.01}
                  min={0}
                  required
                  id='costPrice'
                  type='number'
                  {...register('costPrice')}
                />
                {formState.errors.costPrice && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.costPrice.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='salesPrice'>{t('sales-price')}</Label>
                <Input
                  step={0.01}
                  min={0}
                  id='salesPrice'
                  type='number'
                  {...register('salesPrice')}
                />
                {formState.errors.salesPrice && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.salesPrice.message}
                  </p>
                )}
              </div>
            </div>

						{hasPermissionByPlan(customerPlan, 'basis') && (
							<ScrollArea>
								<div className='grid gap-2'>
									<p className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>{t('default-placement', {count: locations.length})}</p>
									<div className='grid gap-4 p-2 border rounded-sm'>
										{fields.length > 0 && (
											<>
												{locations.length > 1 ? (
													<div className='grid gap-2'>
														<SelectDefaultPlacements
															t={t}
															locations={locations}
															locationPlacementMap={locationPlacementMap}
															fields={fields}
															setValue={setValue}
															remove={remove}
														/>
													</div>
												) : (
														<SelectDefaultPlacement
															t={t}
															location={locations[0]}
															placements={locationPlacementMap.get(locations[0].id)}
															field={fields[0]}
															setValue={setValue}
															remove={remove}
														/>
													)}
											</>
										)}
										{(locations.length > fields.length) && (
											<Button 
												type='button' 
												className='w-full' 
												variant={'outline'} 
												size={'icon'}
												disabled={locations.length <= fields.length}
												onClick={() => append({locationID: "", placementID: -1})}
											>
												<Icons.plus className='size-4' />
											</Button>
										)}
									</div>
								</div>
							</ScrollArea>
						)}

            <Button type='submit' disabled={pending || !formState.isValid}>
              {t('create-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}

function SelectDefaultPlacement(
	{
		t,
		location,
		placements,
		field,
		setValue,
		remove,
	}: {
		t: TFunction<'produkter'>
		location: Location,
		placements: Placement[] | undefined,
		field: FieldArrayWithId<{
			defaults?: {
				locationID: string;
				placementID: number;
			}[] | undefined;
		}, "defaults", "id">
		setValue: UseFormSetValue<{
			customerID: number;
			groupID: number;
			unitID: number;
			text1: string;
			text2: string;
			text3: string;
			sku: string;
			barcode: string;
			costPrice: number;
			salesPrice: number;
			defaults?: {
				locationID: string;
				placementID: number;
			}[] | undefined;
		}>
		remove: UseFieldArrayRemove
	}
) {
	const locationID = useMemo(
		() => location.id,
		[location]
	)
	const [selectedPlacementID, setSelectedPlacementID] = useState(field.placementID)

	const updatePlacementID = (id: number) => {
		setValue(
			`defaults.0`, {
				locationID, placementID: id 
			}, { 
				shouldValidate: true
			},
		)
		setSelectedPlacementID(id)
	}

	return (
		<div className='grid grid-cols-[398px_36px] gap-2'>
			<Select 
				value={(selectedPlacementID != -1) ? selectedPlacementID.toString() : ""}
				onValueChange={id => updatePlacementID(parseInt(id))}
			>
				<SelectTrigger className='w-[398px]' disabled={placements == undefined}>
					<SelectValue placeholder={t('select-placement')} />
				</SelectTrigger>
				<SelectContent>
					{placements?.map(p => (
						<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button className='self-end hover:text-destructive-foreground hover:bg-destructive' variant={'outline'} size={'icon'} onClick={() => remove(0)}>
				<Icons.cross className='size-4' />
			</Button>
		</div>
	)
}

function SelectDefaultPlacements(
	{
		locations,
		locationPlacementMap,
		fields,
		setValue,
		remove,
		t,
	}: 
	{
		t: TFunction<'produkter'>
		locations: Location[]
		locationPlacementMap: Map<LocationID, Placement[]>
		fields: FieldArrayWithId<{
			defaults?: {
				locationID: string;
				placementID: number;
			}[] | undefined;
		}, "defaults", "id">[]
		setValue: UseFormSetValue<{
			customerID: number;
			groupID: number;
			unitID: number;
			text1: string;
			text2: string;
			text3: string;
			sku: string;
			barcode: string;
			costPrice: number;
			salesPrice: number;
			defaults?: {
				locationID: string;
				placementID: number;
			}[] | undefined;
		}>
		remove: UseFieldArrayRemove
	}
) {
	return (
		<>
			{fields.map((field, index) => (
				<SelectDefaultPlacementsItem 
					t={t}
					key={field.id} 
					locations={locations.filter(
						loc => field.locationID == loc.id || !fields.some(f => f.locationID == loc.id)
					)}
					locationPlacementMap={locationPlacementMap}
					field={field}
					index={index}
					setValue={(key: 'locationID' | 'placementID', val: string | number) => setValue(`defaults.${index}.${key}`, val, {shouldValidate:true, shouldDirty:true})}
					removeItem={() => remove(index)}
				/>
			))}
		</>
	)
}

interface SelectDefaultPlacementsItemProps<TField extends FieldArrayWithId<{
	defaults?: {locationID: string, placementID: number}[] | undefined;
}, "defaults", "id"> = FieldArrayWithId<{
		defaults?: {locationID: string, placementID: number}[] | undefined;
	}, "defaults", "id">
> {
	t: TFunction<'produkter'>
	locations: Location[]
	locationPlacementMap: Map<LocationID, Placement[]>
	field: TField
	index: number
	setValue: <TKey extends Exclude<keyof TField, 'id'>, TValue extends TField[TKey]> (key: TKey, value: TValue) => void
	removeItem: () => void
}

function SelectDefaultPlacementsItem( {
	t,
	locations,
	locationPlacementMap,
	field,
	index,
	setValue,
	removeItem,
}: SelectDefaultPlacementsItemProps) {
	const [selectedLocationID, setSelectedLocationID] = useState(field.locationID)
	const [selectedPlacementID, setSelectedPlacementID] = useState(field.placementID)

	const updateLocationID = (id: string) => {
		setValue('locationID', id)
		setSelectedLocationID(id)
	}
	const updatePlacementID = (id: number) => {
		setValue('placementID', id)
		setSelectedPlacementID(id)
	}

	const locationPlacements = useMemo(
		() => locationPlacementMap.get(selectedLocationID),
		[selectedLocationID, locationPlacementMap],
	)

	return (
		<div className='grid grid-cols-[195px_195px_36px] gap-2'>
			<div className='grid gap-2'>
				{index == 0 && <p className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>{t('location')}</p>}
				<Select 
					value={selectedLocationID} 
					onValueChange={id => updateLocationID(id)}
				>
					<SelectTrigger className='w-[195px]'>
						<SelectValue placeholder={t('select-location')} />
					</SelectTrigger>
					<SelectContent>
						{locations.map(loc => (
							<SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className='grid gap-2'>
				{index == 0 && <p className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>{t('placement')}</p>}
				<Select 
					value={(selectedPlacementID != -1) ? selectedPlacementID.toString() : ""}
					onValueChange={id => updatePlacementID(parseInt(id))}
				>
					<SelectTrigger className='w-[195px]' disabled={locationPlacements == undefined}>
						<SelectValue placeholder={t('select-placement')} />
					</SelectTrigger>
					<SelectContent>
						{locationPlacements?.map(p => (
							<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Button className='self-end hover:text-destructive-foreground hover:bg-destructive' variant={'outline'} size={'icon'} onClick={removeItem}>
				<Icons.cross className='size-4' />
			</Button>
		</div>
	)
}
