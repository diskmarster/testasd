import { SiteWrapper } from "@/components/common/site-wrapper";
import { locationService } from "@/service/location";
import { sessionService } from "@/service/session";

export default async function Home() {
  const { user } = await sessionService.validate()
  const location = locationService.getLastVisited(user?.id!)
  return (
    <SiteWrapper title="Nem Lager Boilerplate">
      <pre>Hello, {JSON.stringify(user, null, 2)}</pre>
      <p>Sidst besøgt lokation: {location}</p>
    </SiteWrapper>
  );
}
