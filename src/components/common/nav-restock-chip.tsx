export async function NavRestockChip() {

  async function mockP(res: number, time: number) {
    await new Promise(res => setTimeout(res, time))
    return res
  }

  const count = await mockP(3, 1500)
  return (
    <span className='bg-destructive rounded text-xs py-0.5 px-1 text-destructive-foreground font-semibold'>{count}</span>
  )
}

