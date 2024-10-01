'use client'

import { User } from '@/lib/database/schema/auth'
import { Customer, Location } from '@/lib/database/schema/customer'
import { User as SessionUser } from 'lucia'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface Props {
  user: SessionUser
  customer: Customer
  users: User[]
  locations: Location[]
}

export function TabsAdmin({ customer }: Props) {
  const router = useRouter()
  const pathName = usePathname()
  const searchParams = useSearchParams()
  function createTabParam(val: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', val)
    return params.toString()
  }
  return (
    <Tabs
      defaultValue={searchParams.get('tab') ?? 'brugere'}
      className='w-[400px]'>
      <TabsList>
        <TabsTrigger
          onClick={() =>
            router.push(pathName + '?' + createTabParam('brugere'))
          }
          value='brugere'>
          Brugere
        </TabsTrigger>
        <TabsTrigger
          disabled={customer.plan != 'pro'}
          onClick={() =>
            router.push(pathName + '?' + createTabParam('lokationer'))
          }
          value='lokationer'>
          Lokationer
        </TabsTrigger>
      </TabsList>
      <TabsContent value='brugere'>
        Make changes to your account here.
      </TabsContent>

      <TabsContent value='lokationer'>Change your password here.</TabsContent>
    </Tabs>
  )
}
