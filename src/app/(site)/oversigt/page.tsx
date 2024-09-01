"use client"
import { SiteWrapper } from "@/components/common/site-wrapper";
import { useSession } from "@/context/session";

export default function Home() {
  const { user } = useSession()
  return (
    <SiteWrapper title="Nem Lager Boilerplate">
      <pre>Hello, {JSON.stringify(user, null, 2)}</pre>
    </SiteWrapper>
  );
}
