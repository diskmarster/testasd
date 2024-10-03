'use client'

import { UserNoHash } from '@/lib/database/schema/auth'
import { Customer, Location } from '@/lib/database/schema/customer'
import { User } from 'lucia'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
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
}

export function TabsAdmin({ customer, user, users, locations }: Props) {
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
            <ModalInviteUser />
          ) : currentTab() == 'lokationer' ? (
            <ModalCreateLocation />
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
