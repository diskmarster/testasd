import { locationService } from "@/service/location";
import { Label } from "../ui/label";
import { LocationDialog } from "./profile-location-dialog";
import { sessionService } from "@/service/session";
import { redirect } from "next/navigation";

export async function ProfileLocation() {
  const { session, user } = await sessionService.validate()
  if (!session) return redirect("/log-ind")
  const locations = await locationService.getAllByUserID(user.id)
  return (
    <div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
      <div className='grid gap-0.5'>
        <Label>Skift primær lokation</Label>
        <p className='text-sm text-muted-foreground'>Skift hvilken lokation er din primær</p>
      </div>
      <LocationDialog locations={locations} />
    </div>
  )
}
