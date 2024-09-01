'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from '@/context/session'

export function ProfileHeader() {
  const { session, user } = useSession()

  if (!session) return null
  return (
    <div className='flex items-center gap-4'>
      <Avatar className='size-20 border'>
        <AvatarImage src={undefined} alt={`${user.email} avatar`} />
        <AvatarFallback>
          {user.name.substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className='text-lg font-bold'>{user.name}</p>
        <p className='text-muted-foreground'>{user.email}</p>
      </div>
    </div>
  )
}
