import { sessionService } from "@/service/session"
import { redirect } from "next/navigation"

export default async function LayoutSite({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const { session } = await sessionService.validate()
  if (!session) return redirect("/log-ind")
  return (
    <div className='relative flex min-h-screen flex-col'>
      {/*<Header />*/}
      <main className='flex-1'>{children}</main>
    </div>
  )
}
