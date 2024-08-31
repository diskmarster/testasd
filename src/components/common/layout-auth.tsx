export default async function LayoutAuth({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='w-full md:min-h-screen xl:flex xl:items-center xl:justify-center'>
      <div className='flex min-h-[inherit] w-full items-center justify-center py-12'>
        {children}
      </div>
    </div>
  )
}
