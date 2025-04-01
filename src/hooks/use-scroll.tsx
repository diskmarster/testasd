import { useEffect, useState } from "react";

export function useScroll(): {x: number, y: number} {
  const [scroll, setScroll] = useState({x: 0, y: 0})

  useEffect(() => {
    const onScroll = () => {
      setScroll({y: window.scrollY , x: window.scrollX})
    }
    window.addEventListener('scroll', onScroll)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return scroll
}
