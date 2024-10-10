'use client'

import { UserNoHash } from '@/lib/database/schema/auth'
import { Customer, Location, LocationID } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import {
  isLocationLimitReached,
  isUserLimitReached,
} from '@/service/customer.utils'
import { User } from 'lucia'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'
import { FormCompanyEdit } from './form-company-edit'
import { ModalCreateLocation } from './modal-create-location'
import { ModalInviteUser } from './modal-invite-user'
import { TableAdminLocations } from './table-company-locations'
import { TableAdminUsers } from './table-company-users'

interface Props {
  user: User
  customer: Customer
  users: UserNoHash[]
  locations: Location[]
  currentLocationID: LocationID
}

export function TabsAdmin({
  customer,
  user,
  users,
  locations,
  currentLocationID,
}: Props) {
  const router = useRouter()
  const pathName = usePathname()
  const searchParams = useSearchParams()
  const tabs = ['brugere', 'lokationer', 'firma']

  function createTabParam(val: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', val)
    return params.toString()
  }

  const currentTab = () => {
    const tabParam = searchParams.get('tab')

    if (tabParam && tabs.includes(tabParam)) {
      return tabParam
    } else {
      return tabs[0]
    }
  }

  return (
    <Tabs defaultValue={currentTab()}>
      <div className='flex items-center justify-between md:flex-row flex-col'>
        <TabsList className='grid grid-cols-3 md:w-[300px]'>
          <TabsTrigger
            onClick={() =>
              router.push(pathName + '?' + createTabParam('brugere'))
            }
            value='brugere'>
            Brugere
          </TabsTrigger>
          <TabsTrigger
            onClick={() =>
              router.push(pathName + '?' + createTabParam('lokationer'))
            }
            value='lokationer'>
            Lokationer
          </TabsTrigger>
          <TabsTrigger
            onClick={() =>
              router.push(pathName + '?' + createTabParam('firma'))
            }
            value='firma'>
            Firma
          </TabsTrigger>
        </TabsList>
        <div>
          {currentTab() == 'brugere' ? (
            <div className='flex items-center gap-4'>
              {/* TODO: add customers extra users to function below when its added */}
              {isUserLimitReached(customer.plan, customer.extraUsers, users.length) && (
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-semibold text-destructive'>
                    Du har nået brugergrænsen
                  </span>
                  <TooltipProvider delayDuration={250}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Icons.alert className='size-[18px] text-destructive' />
                      </TooltipTrigger>
                      <TooltipContent className='bg-foreground text-background'>
                        <p>
                          Opgrader din plan for at få adgang til flere brugere
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <ModalInviteUser
                user={user}
                locations={locations}
                currentLocationID={currentLocationID}
                isDisabled={isUserLimitReached(customer.plan, customer.extraUsers, users.length)}
              />
            </div>
          ) : currentTab() == 'lokationer' ? (
            <div className='flex items-center gap-4'>
              {isLocationLimitReached(customer.plan, locations.length) && (
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-semibold text-destructive'>
                    Du har nået lokationsgrænsen
                  </span>
                  <TooltipProvider delayDuration={250}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Icons.alert className='size-[18px] text-destructive' />
                      </TooltipTrigger>
                      <TooltipContent className='bg-foreground text-background'>
                        <p>
                          Opgrader din plan for at få adgang til flere
                          lokationer
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <ModalCreateLocation user={user} users={users}>
                <Button
                  size='icon'
                  variant='outline'
                  disabled={isLocationLimitReached(
                    customer.plan,
                    locations.length,
                  )}
                  className={cn(
                    isLocationLimitReached(customer.plan, locations.length) &&
                    'pointer-events-none',
                  )}>
                  <Icons.gridPlus className='size-5' />
                </Button>
              </ModalCreateLocation>
            </div>
          ) : null}
        </div>
      </div>
      <TabsContent value='brugere'>
        <TableAdminUsers data={users} user={user} customer={customer} />
      </TabsContent>

      <TabsContent value='lokationer'>
        <TableAdminLocations data={locations} user={user} customer={customer} />
      </TabsContent>
      <TabsContent value='firma'>
        <FormCompanyEdit customer={customer} />
      </TabsContent>
    </Tabs>
  )
}
