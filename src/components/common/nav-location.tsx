import { sessionService } from "@/service/session";
import { locationService } from "@/service/location";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export async function NavLocation() {
  const { session, user } = await sessionService.validate()
  if (!session) return null
  const locations = await locationService.getAllByUserID(user.id)
  if (locations.length == 0) return null
  return (
    <Select defaultValue={locations[0].id.toString()}>
      <SelectTrigger className="max-w-44">
        <SelectValue placeholder="Vælg en lokation" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs">Vælg en lokation</SelectLabel>
          {locations.map((loc, i) => (
            <SelectItem key={i} value={loc.id.toString()}>{loc.name}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
