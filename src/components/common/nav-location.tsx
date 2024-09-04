import { sessionService } from "@/service/session";
import { locationService } from "@/service/location";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NavLocationItem } from "./nav-location-item";

export async function NavLocation() {
  const { session, user } = await sessionService.validate()
  if (!session) return null

  const locations = await locationService.getAllByUserID(user.id)
  if (locations.length == 0) return null

  const primaryLocation = locations.find(loc => loc.isPrimary)

  const locationCookie = locationService.getCookie()

  const defualtLocationID = locationCookie ? locationCookie.value : primaryLocation ? primaryLocation.id : locations[0].id

  return (
    <Select defaultValue={defualtLocationID.toString()}>
      <SelectTrigger className="max-w-44">
        <SelectValue placeholder="Vælg en lokation" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs">Vælg en lokation</SelectLabel>
          <SelectSeparator />
          {locations.map((loc, i) => (
            <NavLocationItem key={i} loc={loc} />
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
