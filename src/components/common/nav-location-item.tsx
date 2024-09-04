"use client"

import { LocationWithPrimary } from "@/lib/database/schema/customer";
import { SelectItem } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { changeLocationAction } from "@/app/actions";
import { toast } from "sonner";

export function NavLocationItem({ loc }: { loc: LocationWithPrimary }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function changeLocation() {
    console.log("call me maybe")
    startTransition(async () => {
      const res = await changeLocationAction({ locationID: loc.id })
      if (res && res.serverError) {
        toast.error(res.serverError)
      } {
        toast.success("successssss")
        console.log("refresh")
        router.refresh()
      }
    })
  }

  return (
    <SelectItem value={loc.id.toString()} asChild>
      <div onClick={() => changeLocation()}
        className="flex items-center gap-1">
        <p>{loc.name}</p>
        {loc.isPrimary && (
          <Icons.star className="size-3 fill-warning text-warning" />
        )}
      </div>
    </SelectItem>
  )
}
