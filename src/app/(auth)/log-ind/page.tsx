import { siteConfig } from "@/config/site"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log ind",
  description: `Log ind på ${siteConfig.name} og få styr på din beholdning.`
}

export default async function Page() {
  return (
    <div>Log ind siden</div>
  )
}
