import { signOutAction } from "@/app/(auth)/log-ud/actions";
import { SiteWrapper } from "@/components/common/site-wrapper";
import { inventoryService } from "@/service/inventory";
import { locationService } from "@/service/location";
import { sessionService } from "@/service/session";

export default async function Home() {
  const { session, user } = await sessionService.validate()
  if (!session) return signOutAction()

  const location = await locationService.getLastVisited(user.id!)
  if (!location) return null // TODO: make some error page

  const inventory = await inventoryService.getInventory(location)

  return (
    <SiteWrapper title="Oversigt">
      <p>Sidst besøgt lokation: {location}</p>
      <pre>{JSON.stringify(inventory, null, 2)}</pre>
    </SiteWrapper>
  );
}
