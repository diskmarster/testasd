import { SignUpCard } from "@/components/auth/sign-up-card";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrer",
  description: `Log ind på ${siteConfig.name} og få styr på din beholdning.`
}

export default async function Page() {
  return (
    <section className="w-full">
      <SignUpCard />
    </section>
  )
}
