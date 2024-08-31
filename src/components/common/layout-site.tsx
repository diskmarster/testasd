export default async function LayoutSite({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='relative flex min-h-screen flex-col'>
      {/*<Header />*/}
      <main className='flex-1'>{children}</main>
    </div>
  )
}
