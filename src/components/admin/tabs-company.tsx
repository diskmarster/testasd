'use client'

import { UserNoHash } from '@/lib/database/schema/auth'
import { Customer, Location } from '@/lib/database/schema/customer'
import { User } from 'lucia'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { TabsAdminUsers } from './tabs-company-users'

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
  function createTabParam(val: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', val)
    return params.toString()
  }
  const currentTab = searchParams.get('tab') ?? 'brugere'
  return (
    <Tabs defaultValue={currentTab}>
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
          {currentTab == 'brugere' ? (
            <div>user</div>
          ) : currentTab == 'lokationer' ? (
            <div>lok</div>
          ) : null}
        </div>
      </div>
      <TabsContent value='brugere'>
        <TabsAdminUsers data={users} user={user} customer={customer} />
      </TabsContent>

      <TabsContent value='lokationer'>Change your password here.</TabsContent>
      <TabsContent value='firma'>Change your password here.</TabsContent>
    </Tabs>
  )
}
