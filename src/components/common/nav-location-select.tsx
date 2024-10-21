"use client"

import { LocationID, LocationWithPrimary } from "@/lib/database/schema/customer";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { changeLocationAction } from "@/app/actions";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "@/context/session";
import { siteConfig } from "@/config/site";
import { ModalCreateLocation } from "../admin/modal-create-location";
import { useLanguage } from "@/context/language";
import { useTranslation } from "@/app/i18n/client";

export function NavLocationSelect({ locations, lastVisitedID }: { locations: LocationWithPrimary[], lastVisitedID: string | undefined }) {
  const { user } = useSession()
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'common')

  const pathname = usePathname()

  function changeLocation(locationID: LocationID) {
    startTransition(async () => {
      const res = await changeLocationAction({ locationID: locationID, revalidatePath: pathname })
      if (res && res.serverError) {
        toast.error(t(siteConfig.errorTitle), { description: res.serverError })
      } {
        toast.success(t(siteConfig.successTitle), { description: `${t('toasts.location-select')} ${locations.find(loc => loc.id)?.name ?? t('toasts.unnamed')}` })
        router.refresh()
      }
    })
  }

  return (
    <Select disabled={pending} defaultValue={lastVisitedID} onValueChange={(value: string) => changeLocation(value)}>
      <SelectTrigger className="max-w-44">
        <SelectValue placeholder={t('nav-location-select.select-location')} />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          <SelectLabel className="text-sm font-semibold">
            <div className="flex items-center gap-4 justify-between">
              <p>{t('nav-location-select.select-location')}</p>
              {user && user.role.includes('admin') && (
                <ModalCreateLocation user={user}>
                  <Button size='iconSm' variant='outline'>
                    <Icons.plus className="size-3" />
                  </Button>
                </ModalCreateLocation>
              )}
            </div>
          </SelectLabel>
          <SelectSeparator />
          {locations.map((loc, i) => (
            <SelectItem key={i} value={loc.id}>
              <div
                className="flex items-center gap-1">
                <p>{loc.name}</p>
                {loc.isPrimary && (
                  <Icons.star className="size-3 fill-warning text-warning" />
                )}
                {loc.isBarred && (
                  <div className="text-xs bg-muted text-muted-foreground py-0.5 px-1.5 rounded-sm">Inaktiv</div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
